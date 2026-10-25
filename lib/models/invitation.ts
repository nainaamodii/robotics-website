
 // Team invitations — separate collection, one document per invite.

import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'
import { addMemberWithLimit, getMaxTeamSizeForCompetition } from '@/lib/models/team'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'

export type InvitationStatus = 'pending' | 'accepted' | 'rejected'

export interface Invitation {
  _id?: ObjectId
  teamId: ObjectId
  invitedBy: ObjectId // team leader who sent it
  invitedUser: ObjectId
  status: InvitationStatus
  createdAt: Date
  respondedAt?: Date
}

function oid(id: string) {
  return new ObjectId(id)
}

/**
 * Leader sends an invitation. Enforces:
 *   - Team exists and not finalized
 *   - Caller is the leader
 *   - Target isn't already a member
 *   - No duplicate pending invite (also DB-enforced via partial unique index)
 */
export async function sendInvitation(args: {
  teamId: string
  leaderId: string
  invitedUserId: string
}): Promise<Invitation> {
  const db = await getDB()
  const { teamId, leaderId, invitedUserId } = args

  const team = await db.collection('teams').findOne({ _id: oid(teamId) })
  if (!team) throw new NotFoundError('Team not found')
  if (team.isFinalized) throw new ConflictError('Team is finalized')
  if (team.leaderId?.toString() !== leaderId) {
    throw new ForbiddenError('Only the team leader can send invitations')
  }
  const alreadyMember = (team.members ?? []).some(
    (m: any) => m?.toString?.() === invitedUserId,
  )
  if (alreadyMember) throw new ConflictError('User is already on this team')

  // Don't invite someone who has nowhere to go: a full team, or a person who
  // is already registered on another team in the same competition.
  const max = await getMaxTeamSizeForCompetition(team.competitionId)
  if (max !== null && (team.members ?? []).length >= max) {
    throw new ConflictError('This team is already full')
  }
  const onOtherTeam = await db.collection('teams').findOne(
    { competitionId: team.competitionId, members: oid(invitedUserId) },
    { projection: { _id: 1 } },
  )
  if (onOtherTeam) {
    throw new ConflictError('That user is already on a team in this competition')
  }

  const doc: Invitation = {
    teamId: oid(teamId),
    invitedBy: oid(leaderId),
    invitedUser: oid(invitedUserId),
    status: 'pending',
    createdAt: new Date(),
  }

  try {
    const result = await db.collection('invitations').insertOne(doc)
    return { ...doc, _id: result.insertedId }
  } catch (e: any) {
    // The partial unique index catches simultaneous duplicate invites.
    if (e?.code === 11000) {
      throw new ConflictError('An invitation is already pending for this user')
    }
    throw e
  }
}

/**
 * List a user's pending invitations, with team + inviter details populated.
 * One aggregation, three lookups — much cheaper than doing per-invite queries.
 */
export async function getPendingInvitationsForUser(userId: string) {
  const db = await getDB()
  return db
    .collection('invitations')
    .aggregate([
      { $match: { invitedUser: oid(userId), status: 'pending' } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'teams',
          localField: 'teamId',
          foreignField: '_id',
          as: 'team',
        },
      },
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'invitedBy',
          foreignField: '_id',
          as: 'inviter',
        },
      },
      { $unwind: { path: '$inviter', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'competitions',
          localField: 'team.competitionId',
          foreignField: '_id',
          as: 'competition',
        },
      },
      { $unwind: { path: '$competition', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          status: 1,
          createdAt: 1,
          teamId: 1,
          teamName: '$team.name',
          teamFinalized: '$team.isFinalized',
          competitionName: '$competition.title',
          inviterName: '$inviter.name',
          inviterEmail: '$inviter.email',
        },
      },
    ])
    .toArray()
}

/** Load an invite by id (used by accept/reject handlers). */
export async function getInvitationById(id: string) {
  const db = await getDB()
  if (!ObjectId.isValid(id)) return null
  return db.collection('invitations').findOne({ _id: new ObjectId(id) })
}

/**
 * Accept an invitation:
 *   1. Verify invite is pending and belongs to this user
 *   2. Verify team still exists, not finalized, and user isn't already a member
 *   3. Add user to team.members
 *   4. Mark invite accepted
 *
 * Returns the memberIds AFTER the addition, so the route can bust caches for
 * every member (whose view of the roster just changed).
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string,
): Promise<{ teamId: string; memberIds: string[] }> {
  const db = await getDB()
  const invite = await getInvitationById(invitationId)
  if (!invite) throw new NotFoundError('Invitation not found')
  if (invite.invitedUser.toString() !== userId) {
    throw new ForbiddenError('This invitation is not for you')
  }
  if (invite.status !== 'pending') {
    throw new ConflictError(`Invitation already ${invite.status}`)
  }

  const team = await db.collection('teams').findOne({ _id: invite.teamId })
  if (!team) throw new NotFoundError('Team no longer exists')
  if (team.isFinalized) throw new ConflictError('Team is finalized')

  const uid = new ObjectId(userId)
  const alreadyMember = (team.members ?? []).some(
    (m: any) => m?.toString?.() === userId,
  )

  if (!alreadyMember) {
    // Atomic: enforces the roster cap, no duplicates, and the one-team-per-
    // competition unique index in one conditional update.
    const added = await addMemberWithLimit(invite.teamId, uid)
    if (!added.ok) {
      if (added.reason === 'full') throw new ConflictError('This team is already full')
      if (added.reason === 'locked') throw new ConflictError('Team is finalized')
      if (added.reason === 'not-found') throw new NotFoundError('Team no longer exists')
      // 'already-member' falls through: the invite is simply marked accepted.
    }
  }

  await db.collection('invitations').updateOne(
    { _id: invite._id },
    { $set: { status: 'accepted', respondedAt: new Date() } },
  )

  // Re-fetch the team to get the fresh member list for cache busting.
  const fresh = await db.collection('teams').findOne(
    { _id: invite.teamId },
    { projection: { members: 1 } },
  )
  const memberIds = (fresh?.members ?? []).map(
    (m: any) => m?.toString?.() ?? String(m),
  )

  return { teamId: invite.teamId.toString(), memberIds }
}

/**
 * Reject an invitation. Only the invitee can reject.
 */
export async function rejectInvitation(invitationId: string, userId: string) {
  const db = await getDB()
  const invite = await getInvitationById(invitationId)
  if (!invite) throw new NotFoundError('Invitation not found')
  if (invite.invitedUser.toString() !== userId) {
    throw new ForbiddenError('This invitation is not for you')
  }
  if (invite.status !== 'pending') {
    throw new ConflictError(`Invitation already ${invite.status}`)
  }

  await db.collection('invitations').updateOne(
    { _id: invite._id },
    { $set: { status: 'rejected', respondedAt: new Date() } },
  )
}
