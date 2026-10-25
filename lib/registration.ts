/**
 * Registration rules shared by every endpoint that lets a student sign up for
 * (or look at) a competition. Keeping them in one place guarantees the
 * participate API, the invite flow and the code-validation preview all agree.
 *
 * A competition accepts registrations only when:
 *   1. its parent event exists and is PUBLISHED (drafts are invisible to students),
 *   2. an admin has switched `registrationOpen` on for the competition, and
 *   3. the event has not already concluded.
 */
import { ObjectId } from 'mongodb'
import { getDB } from './db'
import { ConflictError, NotFoundError } from './errors'
import { eventStatus } from './event-status'
import { isPublished } from './models/events'

export interface CompetitionContext {
  competition: any
  event: any | null
}

export type RegistrationBlock = 'registration_closed' | 'event_concluded'

export const REGISTRATION_BLOCK_MESSAGES: Record<RegistrationBlock, string> = {
  registration_closed: 'Registration for this competition is not open',
  event_concluded: 'This event has already concluded',
}

/** Load a competition together with its parent event, or null if it doesn't exist. */
export async function getCompetitionContext(
  competitionId: string | ObjectId,
): Promise<CompetitionContext | null> {
  if (!ObjectId.isValid(competitionId)) return null
  const db = await getDB()
  const competition = await db
    .collection('competitions')
    .findOne({ _id: new ObjectId(competitionId) })
  if (!competition) return null
  const event = competition.eventId
    ? await db.collection('events').findOne({ _id: competition.eventId })
    : null
  return { competition, event }
}

/** Why registration is blocked for this competition right now, or null if it is open. */
export function registrationBlockReason(ctx: CompetitionContext): RegistrationBlock | null {
  if (!ctx.competition.registrationOpen) return 'registration_closed'
  if (ctx.event && eventStatus(ctx.event) === 'past') return 'event_concluded'
  return null
}

/** Visible to students at all? (event exists and is published) */
export function isVisibleToStudents(ctx: CompetitionContext | null): ctx is CompetitionContext {
  return !!ctx && !!ctx.event && isPublished(ctx.event)
}

/**
 * Throws unless the competition can accept registrations right now.
 * Unpublished / unknown competitions are reported as 404 so drafts don't leak.
 */
export async function requireOpenCompetition(
  competitionId: string | ObjectId,
): Promise<CompetitionContext> {
  const ctx = await getCompetitionContext(competitionId)
  if (!isVisibleToStudents(ctx)) throw new NotFoundError('Competition not found')
  const block = registrationBlockReason(ctx)
  if (block) throw new ConflictError(REGISTRATION_BLOCK_MESSAGES[block])
  return ctx
}
