import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'
import { ConflictError } from '@/lib/errors'

export interface Competition {
    _id?: ObjectId
    eventId: ObjectId
    title: string // Changed from 'name' to match your data better, or map it
    type: string // "Autonomous", "Combat" etc.
    description: string

    minTeamSize: number
    maxTeamSize: number
    rules: string[]

    registrationOpen: boolean
    teams: ObjectId[]
}
export async function createCompetition(data: Omit<Competition, '_id' | 'teams'>) {
    const db = await getDB()
    const newComp: Competition = {
        ...data,
        teams: [],
    }
    const result = await db.collection('competitions').insertOne(newComp)

    // Link this competition back to the Event
    await db.collection('events').updateOne(
        { _id: new ObjectId(data.eventId) },
        { $push: { competitions: result.insertedId } }
    )

    return result
}

export async function getCompetitionById(id: string | ObjectId) {
    const db = await getDB()
    return db.collection('competitions').findOne({ _id: new ObjectId(id) })
}

export async function getCompetitionsByEvent(eventId: string | ObjectId) {
    const db = await getDB()
    return db.collection('competitions').find({ eventId: new ObjectId(eventId) }).toArray()
}

export async function updateCompetition(id: string, updates: Partial<Competition>) {
    const db = await getDB()
    const result = await db.collection('competitions').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: 'after' }
    )
    return result
}

/**
 * How many teams in this competition currently have MORE than `size` members.
 * Used to stop an admin lowering `maxTeamSize` below a roster that already exists.
 * (`members.<size>` exists  ⇔  the array has more than `size` entries.)
 */
export async function countTeamsLargerThan(competitionId: string | ObjectId, size: number) {
    const db = await getDB()
    return db.collection('teams').countDocuments({
        competitionId: new ObjectId(competitionId),
        [`members.${size}`]: { $exists: true },
    })
}

export async function deleteCompetition(id: string) {
    const db = await getDB()
    const compId = new ObjectId(id)

    // Refuse to orphan registrations (teams would reference a missing competition).
    const teams = await db.collection('teams').countDocuments({ competitionId: compId })
    if (teams > 0) {
        throw new ConflictError(
            `This competition has ${teams} registered team${teams === 1 ? '' : 's'}. ` +
            'Close registration instead, or delete those teams first.',
        )
    }

    // 1. Get the competition to find its parent Event
    const comp = await db.collection('competitions').findOne({ _id: compId })

    if (comp && comp.eventId) {
        // 2. Remove the competition reference from the Event
        await db.collection('events').updateOne(
            { _id: comp.eventId },
            { $pull: { competitions: compId } }
        )
    }

    // 3. Delete the competition
    const result = await db.collection('competitions').deleteOne({ _id: compId })
    return result.deletedCount > 0
}
