import { nanoid } from 'nanoid'
import { ObjectId } from 'mongodb'
import { getDB } from '../db'
import { ConflictError } from '../errors'

/**
 * Team approval state machine (Option A — approval REPLACES leader finalize).
 *
 *     draft ───submit───▶ submitted ───approve───▶ approved  (terminal, locked)
 *       ▲                     │
 *       │                     └───reject────▶ rejected ──(edit)──▶ draft
 *
 *   - draft:      leader can add/remove members, invite, join by code
 *   - submitted:  locked to member changes, waiting for admin
 *   - approved:   final. no edits. participation locked in.
 *   - rejected:   admin declined; leader can fix and resubmit
 *
 * `isFinalized` is kept in sync as a convenience flag = "locked to member changes"
 * (true when submitted OR approved, false when draft OR rejected). Existing
 * code that reads isFinalized keeps working.
 */
export type TeamApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface Team {
  _id?: ObjectId
  name: string
  /** Lower-cased, whitespace-collapsed name. Backs the per-competition unique-name index. */
  nameKey?: string
  teamCode: string
  competitionId: ObjectId
  leaderId: ObjectId
  members: ObjectId[]
  isFinalized: boolean
  approvalStatus: TeamApprovalStatus
  createdAt: Date
  submittedAt?: Date
  approvedAt?: Date
  approvedBy?: ObjectId // admin token model — populated when we move to real admins
  rejectedAt?: Date
  rejectedReason?: string
  // Legacy: `finalizedAt` still populated on submit for backward compat.
  finalizedAt?: Date
}

/**
 * Read approvalStatus with a legacy fallback: teams created before the state
 * machine existed have no `approvalStatus` field. If they were `isFinalized`
 * we treat them as 'approved'; otherwise 'draft'. Use this wherever you gate
 * on status so old data doesn't behave weirdly.
 */
export function statusOf(team: any): TeamApprovalStatus {
  if (team?.approvalStatus) return team.approvalStatus
  return team?.isFinalized ? 'approved' : 'draft'
}

/** Accept either a valid 24-hex ObjectId string or an existing ObjectId. */
function safeObjectId(id: string | ObjectId): any {
  return /^[0-9a-fA-F]{24}$/.test(String(id)) ? new ObjectId(String(id)) : id
}

/** "  Nexus   Vanguard " → "nexus vanguard". Used for case-insensitive uniqueness. */
export function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Which unique index tripped an E11000? Prefers keyPattern, falls back to the message. */
function duplicateKeyOf(e: any): 'teamCode' | 'members' | 'nameKey' | 'unknown' {
  const kp = e?.keyPattern
  if (kp && typeof kp === 'object') {
    if ('nameKey' in kp) return 'nameKey'
    if ('members' in kp) return 'members'
    if ('teamCode' in kp) return 'teamCode'
  }
  const msg = String(e?.message ?? '')
  if (msg.includes('unique_team_name_per_competition')) return 'nameKey'
  if (msg.includes('unique_member_per_competition')) return 'members'
  if (msg.includes('teamCode')) return 'teamCode'
  return 'unknown'
}

const TEAM_CODE_LENGTH = 6
const CREATE_TEAM_MAX_RETRIES = 5


export async function createTeam(data: {
  name: string
  leaderId: string
  competitionId: string
}) {
  const db = await getDB()
  const name = data.name.trim().replace(/\s+/g, ' ')
  const nameKey = normalizeTeamName(name)

  for (let attempt = 0; attempt < CREATE_TEAM_MAX_RETRIES; attempt++) {
    const teamCode = nanoid(TEAM_CODE_LENGTH).toUpperCase()
    const newTeam = {
      name,
      nameKey,
      teamCode,
      competitionId: safeObjectId(data.competitionId),
      leaderId: safeObjectId(data.leaderId),
      members: [safeObjectId(data.leaderId)],
      isFinalized: false,
      approvalStatus: 'draft' as TeamApprovalStatus,
      createdAt: new Date(),
    }

    try {
      const result = await db.collection('teams').insertOne(newTeam)
      return { ...newTeam, _id: result.insertedId }
    } catch (error: any) {
      if (error?.code === 11000) {
        switch (duplicateKeyOf(error)) {
          case 'teamCode':
            if (attempt < CREATE_TEAM_MAX_RETRIES - 1) continue // collision — retry with a new nanoid
            break
          case 'members':
            // Compound unique index (competitionId, members): this user is already
            // on a team in this competition (e.g. a double-clicked submit).
            throw new ConflictError('You are already on a team in this competition')
          case 'nameKey':
            throw new ConflictError('A team with this name already exists in this competition')
        }
      }
      throw error
    }
  }

  // If we ever hit this line, something is very wrong (or the entropy is bad).
  throw new Error('Failed to generate a unique team code after retries')
}

/**
 * Look up a team by its invite code — lightweight validation, no mutation.
 * Used by /api/teams/validate-code so the wizard can preview the team name
 * before the user commits to joining.
 *
 * Returns only enough for the UI + the server-side checks (name, lock state,
 * which competition it belongs to, roster). Deliberately does NOT expose full
 * member details — that's what /api/teams/[id] is for after joining.
 *
 * NOTE: `competitionId` MUST be projected. It used to be missing, which made the
 * "does this code belong to this competition?" check in /api/participate
 * compare `undefined` and reject EVERY join attempt.
 */
export async function getTeamByCode(code: string) {
  const db = await getDB()
  return db.collection('teams').findOne(
    { teamCode: code },
    {
      projection: {
        name: 1,
        isFinalized: 1,
        approvalStatus: 1,
        members: 1,
        competitionId: 1,
        leaderId: 1,
      },
    },
  )
}

/** maxTeamSize of a competition, or null if the competition can't be found. */
export async function getMaxTeamSizeForCompetition(
  competitionId: string | ObjectId,
): Promise<number | null> {
  const db = await getDB()
  const comp = await db
    .collection('competitions')
    .findOne({ _id: safeObjectId(competitionId) }, { projection: { maxTeamSize: 1 } })
  return typeof comp?.maxTeamSize === 'number' ? comp.maxTeamSize : null
}

export type AddMemberFailure = 'not-found' | 'locked' | 'already-member' | 'full'

/**
 * Add a user to a team ATOMICALLY, enforcing every roster rule in a single
 * conditional update so concurrent requests cannot overfill a team:
 *   - team must not be submitted/approved (isFinalized),
 *   - user must not already be a member (no duplicate members),
 *   - roster must be below the competition's maxTeamSize
 *     (`members.<max-1>` not existing ⇔ fewer than `max` members).
 * The (competitionId, members) unique index additionally stops the user from
 * being on two teams in the same competition; that surfaces as a ConflictError.
 */
export async function addMemberWithLimit(
  teamId: string | ObjectId,
  userId: string | ObjectId,
): Promise<{ ok: true; team: any } | { ok: false; reason: AddMemberFailure }> {
  const db = await getDB()
  const tid = safeObjectId(teamId)
  const uid = safeObjectId(userId)

  const team = await db.collection('teams').findOne({ _id: tid })
  if (!team) return { ok: false, reason: 'not-found' }

  const max = await getMaxTeamSizeForCompetition(team.competitionId)
  const filter: any = { _id: tid, isFinalized: { $ne: true }, members: { $ne: uid } }
  if (max !== null) filter[`members.${max - 1}`] = { $exists: false }

  try {
    const result: any = await db
      .collection('teams')
      .findOneAndUpdate(filter, { $push: { members: uid } } as any, { returnDocument: 'after' })
    const updated = result?.value ?? result
    if (updated && updated._id) return { ok: true, team: updated }
  } catch (e: any) {
    if (e?.code === 11000 && duplicateKeyOf(e) === 'members') {
      throw new ConflictError('This person is already on another team in this competition')
    }
    throw e
  }

  // The conditional update matched nothing — work out why for a precise message.
  const fresh = await db.collection('teams').findOne({ _id: tid })
  if (!fresh) return { ok: false, reason: 'not-found' }
  if (fresh.isFinalized) return { ok: false, reason: 'locked' }
  if ((fresh.members ?? []).some((m: any) => String(m) === String(uid))) {
    return { ok: false, reason: 'already-member' }
  }
  return { ok: false, reason: 'full' }
}

/**
 * Legacy direct-join helper (the UI now goes through join requests). Still
 * routes through addMemberWithLimit so it can never bypass the size limit.
 * Returns the team, or null if it doesn't exist / is locked.
 */
export async function joinTeamByCode(userId: string, code: string) {
  const db = await getDB()
  const team = await db.collection('teams').findOne({ teamCode: code })
  if (!team) return null
  const result = await addMemberWithLimit(team._id, userId)
  if (result.ok) return result.team
  if (result.reason === 'full') throw new ConflictError('This team is already full')
  if (result.reason === 'already-member') return team
  return null
}

// ────────────────────────────────────────────────────────────
// Shared aggregation pieces
// ────────────────────────────────────────────────────────────

/**
 * Join a team to its competition and that competition's event. `$convert`
 * (instead of `$toObjectId`) tolerates legacy docs whose competitionId is a
 * non-ObjectId string — they just get null instead of aborting the pipeline.
 */
const CONTEXT_STAGES: any[] = [
  {
    $addFields: {
      competitionIdObj: {
        $convert: { input: '$competitionId', to: 'objectId', onError: null, onNull: null },
      },
    },
  },
  {
    $lookup: {
      from: 'competitions',
      localField: 'competitionIdObj',
      foreignField: '_id',
      as: 'competitionDetails',
    },
  },
  { $unwind: { path: '$competitionDetails', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'events',
      localField: 'competitionDetails.eventId',
      foreignField: '_id',
      as: 'eventDetails',
    },
  },
  { $unwind: { path: '$eventDetails', preserveNullAndEmptyArrays: true } },
]

const CONTEXT_FIELDS: Record<string, any> = {
  competitionName: {
    $ifNull: ['$competitionDetails.title', '$competitionDetails.name', 'Unknown Competition'],
  },
  minTeamSize: '$competitionDetails.minTeamSize',
  maxTeamSize: '$competitionDetails.maxTeamSize',
  registrationOpen: '$competitionDetails.registrationOpen',
  eventId: '$eventDetails._id',
  eventName: '$eventDetails.name',
  eventDate: '$eventDetails.date',
}

/**
 * Member projection. Students only ever see name/email/codename of teammates;
 * the admin view additionally exposes contact + academic details.
 */
function memberProjection(adminView: boolean) {
  const base: Record<string, any> = {
    _id: '$$member._id',
    name: '$$member.name',
    email: '$$member.email',
    codename: '$$member.codename',
  }
  const adminOnly: Record<string, any> = adminView
    ? {
        phone: '$$member.phone',
        rollNo: '$$member.rollNo',
        department: '$$member.department',
        college: '$$member.college',
        isMnnit: '$$member.isMnnit',
      }
    : {}
  return { $map: { input: '$memberDetails', as: 'member', in: { ...base, ...adminOnly } } }
}

const USERS_LOOKUP = {
  $lookup: {
    from: 'users',
    localField: 'members',
    foreignField: '_id',
    as: 'memberDetails',
  },
}

/**
 * Fetch a team by _id with member details and competition/event info populated.
 * Single aggregation pipeline — one round-trip instead of N+1 lookups.
 *
 * `adminView` adds members' phone / roll number / department / college. Callers
 * MUST decide authorization before passing it (see GET /api/teams/[id]).
 */
export async function getTeamById(id: string, opts: { adminView?: boolean } = {}) {
  const db = await getDB()
  if (!ObjectId.isValid(id)) return null

  const pipeline = [
    { $match: { _id: new ObjectId(id) } },
    USERS_LOOKUP,
    ...CONTEXT_STAGES,
    {
      $project: {
        name: 1,
        teamCode: 1,
        isFinalized: 1,
        approvalStatus: 1,
        rejectedReason: 1,
        leaderId: 1,
        competitionId: 1,
        createdAt: 1,
        submittedAt: 1,
        approvedAt: 1,
        rejectedAt: 1,
        ...CONTEXT_FIELDS,
        members: memberProjection(!!opts.adminView),
      },
    },
  ]

  const [team] = await db.collection('teams').aggregate(pipeline).toArray()
  return team ?? null
}

/**
 * Leader submits the team for admin approval.
 * Replaces the old "finalize" semantics — the leader no longer terminally
 * locks the team; that authority now belongs to the admin.
 *
 * Allowed transitions: draft → submitted, rejected → submitted.
 * Sets isFinalized=true so member-mutation guards continue to work.
 *
 * Enforces the competition's minimum roster size, and refuses a FIRST
 * submission once an admin has closed registration (a team an admin already
 * rejected may still resubmit — they were explicitly given another chance).
 */
export async function submitTeamForApproval(teamId: string, userId: string) {
  const db = await getDB()

  if (!ObjectId.isValid(teamId) || !ObjectId.isValid(userId)) {
    throw new Error('Invalid System ID Format')
  }

  // Load first to check current status (can't express "either draft OR rejected"
  // cleanly in a single findOneAndUpdate WHERE alongside the leader check).
  const team = await db.collection('teams').findOne({
    _id: safeObjectId(teamId),
    leaderId: safeObjectId(userId),
  })
  if (!team) {
    throw new Error(
      'Unauthorized: Leader credentials mismatch or team not found',
    )
  }

  const current = statusOf(team)
  if (current === 'submitted') {
    throw new ConflictError('Team is already submitted for approval')
  }
  if (current === 'approved') {
    throw new ConflictError('Team is already approved — no resubmission needed')
  }

  const competition = await db
    .collection('competitions')
    .findOne({ _id: safeObjectId(team.competitionId) })
  if (competition) {
    const size = (team.members ?? []).length
    const min = typeof competition.minTeamSize === 'number' ? competition.minTeamSize : 1
    if (size < min) {
      throw new ConflictError(
        `This competition requires at least ${min} member${min === 1 ? '' : 's'} — your team has ${size}.`,
      )
    }
    if (current === 'draft' && competition.registrationOpen === false) {
      throw new ConflictError('Registration for this competition is closed')
    }
  }

  const now = new Date()
  const result = await db.collection('teams').findOneAndUpdate(
    { _id: safeObjectId(teamId) },
    {
      $set: {
        approvalStatus: 'submitted' as TeamApprovalStatus,
        isFinalized: true, // keep legacy flag in sync
        submittedAt: now,
        finalizedAt: now, // legacy
      },
      $unset: { rejectedAt: '', rejectedReason: '' }, // clear old reject metadata
    },
    { returnDocument: 'after' },
  )
  return result
}

/**
 * Admin approves a submitted team. Terminal state — no further edits.
 * Optionally records the admin user id (currently unused because admin auth
 * is the shared-password model; will matter when we move to role-based admins).
 */
export async function approveTeam(teamId: string, adminUserId?: string) {
  const db = await getDB()
  if (!ObjectId.isValid(teamId)) throw new Error('Invalid team id')

  const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) })
  if (!team) return null
  const current = statusOf(team)
  if (current !== 'submitted') {
    throw new ConflictError(
      `Cannot approve a team in '${current}' state — must be 'submitted'`,
    )
  }

  return db.collection('teams').findOneAndUpdate(
    { _id: new ObjectId(teamId) },
    {
      $set: {
        approvalStatus: 'approved' as TeamApprovalStatus,
        isFinalized: true,
        approvedAt: new Date(),
        ...(adminUserId && ObjectId.isValid(adminUserId)
          ? { approvedBy: new ObjectId(adminUserId) }
          : {}),
      },
    },
    { returnDocument: 'after' },
  )
}

/**
 * Admin rejects a submitted team. Team goes back to editable — leader can
 * make changes and resubmit.
 */
export async function rejectTeam(teamId: string, reason?: string) {
  const db = await getDB()
  if (!ObjectId.isValid(teamId)) throw new Error('Invalid team id')

  const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) })
  if (!team) return null
  const current = statusOf(team)
  if (current !== 'submitted') {
    throw new ConflictError(
      `Cannot reject a team in '${current}' state — must be 'submitted'`,
    )
  }

  return db.collection('teams').findOneAndUpdate(
    { _id: new ObjectId(teamId) },
    {
      $set: {
        approvalStatus: 'rejected' as TeamApprovalStatus,
        isFinalized: false, // reopen for edits
        rejectedAt: new Date(),
        rejectedReason: reason ?? '',
      },
    },
    { returnDocument: 'after' },
  )
}

/**
 * Admin: list teams (optionally filtered by approval status) with leader,
 * competition and event populated. Used by /api/admin/teams (review queue)
 * and /api/admin/participations (everything, newest first).
 */
export async function listTeamsByStatus(
  status?: TeamApprovalStatus,
  opts: { sort?: 'review' | 'recent' } = {},
) {
  const db = await getDB()
  const match: any = {}
  if (status) match.approvalStatus = status

  const sort =
    opts.sort === 'recent' ? { createdAt: -1 } : { submittedAt: -1, createdAt: -1 }

  return db
    .collection('teams')
    .aggregate([
      { $match: match },
      { $sort: sort },
      ...CONTEXT_STAGES,
      {
        $lookup: {
          from: 'users',
          localField: 'leaderId',
          foreignField: '_id',
          as: 'leader',
        },
      },
      { $unwind: { path: '$leader', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          teamCode: 1,
          approvalStatus: 1,
          isFinalized: 1,
          submittedAt: 1,
          approvedAt: 1,
          rejectedAt: 1,
          rejectedReason: 1,
          createdAt: 1,
          competitionId: 1,
          memberCount: { $size: { $ifNull: ['$members', []] } },
          leaderName: '$leader.name',
          leaderEmail: '$leader.email',
          leaderPhone: '$leader.phone',
          ...CONTEXT_FIELDS,
        },
      },
    ])
    .toArray()
}

/**
 * Legacy alias — old code (and any frontend still calling /finalize) hits this.
 * Semantically identical to submitTeamForApproval now.
 */
export const finalizeTeam = submitTeamForApproval

/**
 * Remove the caller from a team. Rules:
 *   - Team must exist and not be finalized
 *   - Caller must be a member
 *   - Caller must NOT be the leader (leaders can't leave — they must either
 *     transfer leadership or delete the team; for now we just reject)
 *
 * Returns:
 *   - 'ok'                — removed successfully
 *   - 'not-member'        — user isn't on this team
 *   - 'leader'            — leader tried to leave
 *   - 'finalized'         — team is locked
 *   - 'not-found'         — team doesn't exist
 */
export async function leaveTeam(
  teamId: string,
  userId: string,
): Promise<'ok' | 'not-member' | 'leader' | 'finalized' | 'not-found'> {
  const db = await getDB()
  const team = await db.collection('teams').findOne({ _id: safeObjectId(teamId) })
  if (!team) return 'not-found'
  if (team.isFinalized) return 'finalized'
  if (team.leaderId?.toString() === userId) return 'leader'

  const uid = safeObjectId(userId)
  const isMember = (team.members ?? []).some((m: any) => m?.toString?.() === userId)
  if (!isMember) return 'not-member'

  await db.collection('teams').updateOne(
    { _id: safeObjectId(teamId) },
    { $pull: { members: uid } as any },
  )
  return 'ok'
}

/**
 * Leader removes a member. Rules:
 *   - Team must exist and not be finalized
 *   - Caller must be the leader
 *   - Target must be a member and NOT the leader (leader can't kick themselves)
 *
 * Returns the same discriminants as leaveTeam so the route can pick a status code.
 */
export async function kickMember(
  teamId: string,
  callerUserId: string,
  targetUserId: string,
): Promise<
  'ok' | 'not-leader' | 'target-not-member' | 'cant-kick-self' | 'finalized' | 'not-found'
> {
  const db = await getDB()
  const team = await db.collection('teams').findOne({ _id: safeObjectId(teamId) })
  if (!team) return 'not-found'
  if (team.isFinalized) return 'finalized'
  if (team.leaderId?.toString() !== callerUserId) return 'not-leader'
  if (callerUserId === targetUserId) return 'cant-kick-self'

  const isMember = (team.members ?? []).some(
    (m: any) => m?.toString?.() === targetUserId,
  )
  if (!isMember) return 'target-not-member'

  await db.collection('teams').updateOne(
    { _id: safeObjectId(teamId) },
    { $pull: { members: safeObjectId(targetUserId) } as any },
  )
  return 'ok'
}

/**
 * Delete a team (and clean up dangling references).
 *
 * Authorization contract:
 *   - Leader can delete their own team AS LONG AS it isn't 'approved'
 *     (approved teams participate in the competition — undoing that is an
 *     admin action). Rejected/draft/submitted are all fine.
 *   - Admin can delete at any state (pass isAdmin=true).
 *
 * Cascade behavior:
 *   - Pull the team from every project's `teamIds` array (no orphaned refs).
 *   - Delete PENDING invitations and join requests for the team (past
 *     accepted/rejected records stay for audit — they're historical fact and small).
 *
 * Returns the list of memberIds so the route can bust caches for every one.
 */
export async function deleteTeamById(
  teamId: string,
  callerUserId: string,
  isAdmin: boolean,
): Promise<{ memberIds: string[] }> {
  const db = await getDB()
  if (!ObjectId.isValid(teamId)) return { memberIds: [] }

  const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) })
  if (!team) return { memberIds: [] }

  const isLeader = team.leaderId?.toString() === callerUserId
  if (!isAdmin && !isLeader) {
    throw new ConflictError('Only the team leader or an admin can delete a team')
  }
  if (!isAdmin && statusOf(team) === 'approved') {
    throw new ConflictError(
      'Approved teams can only be deleted by an admin',
    )
  }

  const memberIds: string[] = (team.members ?? []).map(
    (m: any) => m?.toString?.() ?? String(m),
  )

  // Do cascade cleanups first, then the delete. In the (unlikely) event one of
  // these fails, we haven't yet destroyed the team doc — safer to leave it
  // than to have a partial delete.
  await Promise.all([
    db
      .collection('projects')
      .updateMany(
        { teamIds: new ObjectId(teamId) },
        { $pull: { teamIds: new ObjectId(teamId) } as any },
      ),
    db
      .collection('invitations')
      .deleteMany({ teamId: new ObjectId(teamId), status: 'pending' }),
    db
      .collection('join_requests')
      .deleteMany({ teamId: new ObjectId(teamId), status: 'pending' }),
  ])

  await db.collection('teams').deleteOne({ _id: new ObjectId(teamId) })

  return { memberIds }
}

/**
 * Transfer leadership to another current member.
 * Rules:
 *   - Caller must be the current leader
 *   - New leader must ALREADY be a member (transfer, not invite)
 *   - Team can't be 'approved' (locked state)
 *   - New leader != old leader (no-op guard)
 */
export async function transferLeadership(
  teamId: string,
  currentLeaderId: string,
  newLeaderId: string,
): Promise<
  | { status: 'ok'; memberIds: string[] }
  | 'not-found'
  | 'not-leader'
  | 'locked'
  | 'new-leader-not-member'
  | 'same-user'
> {
  const db = await getDB()
  if (!ObjectId.isValid(teamId)) return 'not-found'
  if (!ObjectId.isValid(newLeaderId)) return 'new-leader-not-member'

  if (currentLeaderId === newLeaderId) return 'same-user'

  const team = await db.collection('teams').findOne({ _id: new ObjectId(teamId) })
  if (!team) return 'not-found'
  if (team.leaderId?.toString() !== currentLeaderId) return 'not-leader'
  if (statusOf(team) === 'approved') return 'locked'

  const isMember = (team.members ?? []).some(
    (m: any) => m?.toString?.() === newLeaderId,
  )
  if (!isMember) return 'new-leader-not-member'

  await db.collection('teams').updateOne(
    { _id: new ObjectId(teamId) },
    { $set: { leaderId: new ObjectId(newLeaderId) } },
  )

  const memberIds: string[] = (team.members ?? []).map(
    (m: any) => m?.toString?.() ?? String(m),
  )
  return { status: 'ok', memberIds }
}

/** Convenience: the raw team doc with just members[] (for cache busting all members). */
export async function getTeamMembersRaw(teamId: string): Promise<string[]> {
  const db = await getDB()
  if (!ObjectId.isValid(teamId)) return []
  const team = await db.collection('teams').findOne(
    { _id: new ObjectId(teamId) },
    { projection: { members: 1 } },
  )
  return (team?.members ?? []).map((m: any) => m?.toString?.() ?? String(m))
}

export async function getUserTeamForCompetition(userId: string, competitionId: string) {
  const db = await getDB()
  return db.collection('teams').findOne({
    competitionId: safeObjectId(competitionId),
    members: safeObjectId(userId),
  })
}

/** Newest team the user is on. Uses the (members, createdAt desc) index. */
export async function getLatestTeamForUser(userId: string) {
  const [team] = await runUserTeamsPipeline(userId, { limit: 1 })
  return team ?? null
}

/** All teams the user is on, newest first. Uses the (members, createdAt desc) index. */
export async function getAllTeamsForUser(userId: string) {
  return runUserTeamsPipeline(userId)
}

/** Shared aggregation for "teams by user" — same shape for both list/single endpoints. */
async function runUserTeamsPipeline(userId: string, opts: { limit?: number } = {}) {
  const db = await getDB()
  const pipeline: any[] = [
    { $match: { members: new ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
  ]
  if (opts.limit) pipeline.push({ $limit: opts.limit })
  pipeline.push(
    USERS_LOOKUP,
    ...CONTEXT_STAGES,
    {
      $project: {
        name: 1,
        teamCode: 1,
        isFinalized: 1,
        approvalStatus: 1,
        rejectedReason: 1,
        leaderId: 1,
        competitionId: 1,
        createdAt: 1,
        ...CONTEXT_FIELDS,
        members: memberProjection(false),
      },
    },
  )

  return db.collection('teams').aggregate(pipeline).toArray()
}
