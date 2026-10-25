import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'
import { ConflictError } from '@/lib/errors'
import { eventStatus, registrationInfo } from '@/lib/event-status'

export interface Event {
    _id?: ObjectId
    name: string
    year: number // Auto-derived by the validation layer from startDate.
    // Raw ISO date strings — the source of truth. `date` (below) is a
    // pre-formatted display string derived from these; both are stored so
    // the frontend can pick whichever it prefers.
    startDate?: string // "YYYY-MM-DD"
    endDate?: string   // "YYYY-MM-DD"
    // When students can register. ISO instants; null/absent = no window, in
    // which case each competition's `registrationOpen` switch decides.
    registrationOpensAt?: string | null
    registrationClosesAt?: string | null
    // UI fields
    theme: string
    tagline: string
    description: string
    date: string // Pre-formatted, e.g. "OCT 24-26, 2026"
    location: string
    participantsLabel: string // "500+ Engineers"
    highlights: string[]

    isActive: boolean
    /**
     * Draft / published flag. Only published events are visible on the student
     * website. Documents created before this field existed have no value and are
     * treated as published (see PUBLISHED_FILTER) so nothing disappears on upgrade.
     */
    published?: boolean
    competitions: ObjectId[]
    createdAt: Date
    updatedAt?: Date
}

/** Mongo filter matching events the public may see. Legacy docs (field missing) stay visible. */
export const PUBLISHED_FILTER = { published: { $ne: false } } as const

/** True unless the event has been explicitly marked as a draft. */
export function isPublished(e: { published?: boolean } | null | undefined): boolean {
    return !!e && e.published !== false
}

function isDuplicateKey(error: any): boolean {
    return error?.code === 11000
}

type NewEventInput = Omit<Event, '_id' | 'competitions' | 'createdAt' | 'isActive' | 'published'> & {
    published?: boolean
}

export async function createEvent(eventData: NewEventInput) {
    const db = await getDB()
    const newEvent: Event = {
        ...eventData,
        published: eventData.published ?? false,
        competitions: [],
        isActive: true,
        createdAt: new Date(),
    }
    try {
        return await db.collection('events').insertOne(newEvent)
    } catch (error) {
        // Unique index on events.name (scripts/setup-indexes.ts).
        if (isDuplicateKey(error)) throw new ConflictError('An event with this name already exists')
        throw error
    }
}

export async function getEventByName(name: string) {
    const db = await getDB()
    return db.collection('events').findOne({ name })
}


export async function getEventById(id: string) {
    const db = await getDB()
    return db.collection('events').findOne({ _id: new ObjectId(id) })
}

/**
 * All events with their competitions populated.
 *   publishedOnly   — hide drafts (use for anything public)
 *   newestFirst     — sort by creation date, newest first (admin list)
 */
export async function getAllEvents(
    opts: { publishedOnly?: boolean; newestFirst?: boolean } = {},
) {
    const db = await getDB()
    const pipeline: any[] = []
    if (opts.publishedOnly) pipeline.push({ $match: PUBLISHED_FILTER })
    if (opts.newestFirst) pipeline.push({ $sort: { createdAt: -1 } })
    pipeline.push(
        {
            $lookup: {
                from: "competitions",
                localField: "competitions",
                foreignField: "_id",
                as: "competitionsList" // Store populated array here
            }
        },
        // Overwrite the original ID array with the populated object array
        {
            $addFields: {
                competitions: "$competitionsList"
            }
        },
        // Remove the temporary field
        {
            $project: {
                competitionsList: 0
            }
        },
    )
    return db.collection('events').aggregate(pipeline).toArray()
}

/** Adds the computed `status` ('upcoming' | 'past') the frontend filters on. */
export function withStatus<T extends { startDate?: string; endDate?: string }>(events: T[]) {
    const now = new Date()
    return events.map((e: any) => ({
        ...e,
        status: eventStatus(e, now),
        registration: registrationInfo(e, null, now),
        competitions: Array.isArray(e.competitions)
            ? e.competitions.map((c: any) =>
                  c && typeof c === 'object' && 'title' in c
                      ? { ...c, registration: registrationInfo(e, c, now) }
                      : c,
              )
            : e.competitions,
    })) as (T & { status: ReturnType<typeof eventStatus> })[]
}

/**
 * Admin view: every event (drafts included) with per-competition registration
 * counts, so new student registrations show up on the dashboard immediately.
 */
export async function getAdminEvents() {
    const db = await getDB()
    const [events, stats] = await Promise.all([
        getAllEvents({ publishedOnly: false, newestFirst: true }),
        db
            .collection('teams')
            .aggregate([
                {
                    $group: {
                        _id: '$competitionId',
                        teams: { $sum: 1 },
                        members: { $sum: { $size: { $ifNull: ['$members', []] } } },
                        pendingReview: {
                            $sum: { $cond: [{ $eq: ['$approvalStatus', 'submitted'] }, 1, 0] },
                        },
                    },
                },
            ])
            .toArray(),
    ])
    const byCompetition = new Map(stats.map((s: any) => [String(s._id), s]))
    const now = new Date()

    return events.map((e: any) => {
        const competitions = (e.competitions ?? []).map((c: any) => {
            const s: any = byCompetition.get(String(c._id))
            return {
                ...c,
                registration: registrationInfo(e, c, now),
                teamCount: s?.teams ?? 0,
                memberCount: s?.members ?? 0,
                pendingReview: s?.pendingReview ?? 0,
            }
        })
        return {
            ...e,
            published: isPublished(e),
            competitions,
            teamCount: competitions.reduce((n: number, c: any) => n + c.teamCount, 0),
            status: eventStatus(e, now),
        }
    })
}

export async function updateEvent(id: string, updates: Partial<Event>) {
    const db = await getDB()
    try {
        return await db.collection('events').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        )
    } catch (error) {
        if (isDuplicateKey(error)) throw new ConflictError('An event with this name already exists')
        throw error
    }
}

/** Number of teams registered in any of the given competitions. */
async function countTeamsInCompetitions(competitionIds: ObjectId[]): Promise<number> {
    if (competitionIds.length === 0) return 0
    const db = await getDB()
    return db.collection('teams').countDocuments({ competitionId: { $in: competitionIds } })
}

export async function deleteEvent(id: string) {
    const db = await getDB()
    const eventId = new ObjectId(id)

    // 1. Find the event to get its competitions
    const event = await db.collection('events').findOne({ _id: eventId })

    if (event && event.competitions && event.competitions.length > 0) {
        // Refuse to orphan registrations: deleting competitions would leave teams
        // pointing at nothing and silently destroy the registration history.
        const teams = await countTeamsInCompetitions(event.competitions)
        if (teams > 0) {
            throw new ConflictError(
                `This event has ${teams} registered team${teams === 1 ? '' : 's'}. ` +
                'Unpublish it instead, or delete those teams first.',
            )
        }
        // 2. Delete all associated competitions
        await db.collection('competitions').deleteMany({
            _id: { $in: event.competitions }
        })
    }

    const result = await db.collection('events').deleteOne({ _id: eventId })
    return result.deletedCount > 0
}
