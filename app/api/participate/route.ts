import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-guard'
import {
  createTeam,
  getTeamByCode,
  getUserTeamForCompetition,
} from '@/lib/models/team'
import { createJoinRequest } from '@/lib/models/join-request'
import { getUserById } from '@/lib/models/user'
import {
  getCompetitionContext,
  isVisibleToStudents,
  registrationBlockReason,
  requireOpenCompetition,
} from '@/lib/registration'
import { ObjectIdSchema, ParticipateSchema } from '@/lib/validation'
import {
  AuthError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
} from '@/lib/errors'
import { cacheDel, cacheKeys } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/participate?competitionId=...
 * Everything the registration page needs: competition + event details, whether
 * the caller can register right now (and if not, why), and their existing
 * registration for this competition if they have one.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUser()
    const competitionId = ObjectIdSchema.parse(request.nextUrl.searchParams.get('competitionId'))

    const ctx = await getCompetitionContext(competitionId)
    if (!isVisibleToStudents(ctx)) throw new NotFoundError('Competition not found')

    const existing = await getUserTeamForCompetition(userId, competitionId)
    const blockedReason = registrationBlockReason(ctx)
    const { competition, event } = ctx

    return NextResponse.json({
      competition: {
        _id: competition._id,
        title: competition.title,
        type: competition.type,
        description: competition.description,
        minTeamSize: competition.minTeamSize,
        maxTeamSize: competition.maxTeamSize,
        rules: competition.rules ?? [],
        registrationOpen: !!competition.registrationOpen,
      },
      event: { _id: event._id, name: event.name, date: event.date, location: event.location },
      registration: existing
        ? {
            teamId: existing._id,
            teamName: existing.name,
            approvalStatus: existing.approvalStatus ?? (existing.isFinalized ? 'approved' : 'draft'),
          }
        : null,
      canRegister: !existing && !blockedReason,
      blockedReason,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/participate
 *
 * CREATE → leader creates a team; they become member #1 immediately.
 * JOIN   → user submits a team code. Instead of joining directly, we file a
 *          JOIN REQUEST; the team leader approves or rejects it. Response:
 *          `{ pending: true, requestId, teamName }`.
 *
 * Both are refused unless the competition is on a published event, has
 * registration open and the event hasn't concluded. A user can hold only one
 * team per competition (also enforced by a unique index).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser()
    const input = ParticipateSchema.parse(await request.json())

    const user = await getUserById(userId)
    if (!user) throw new AuthError('Account not found')
    if (!user.isProfileComplete) {
      throw new ForbiddenError('Complete your profile before registering')
    }

    // Work out which competition this is about. For JOIN the TEAM decides it —
    // the client-sent competitionId is only a cross-check.
    let competitionId: string
    let joinTeam: any = null
    if (input.action === 'JOIN') {
      joinTeam = await getTeamByCode(input.teamCode)
      if (!joinTeam) throw new NotFoundError('Invalid team code')
      competitionId = String(joinTeam.competitionId)
      if (input.competitionId && input.competitionId !== competitionId) {
        throw new ConflictError('This code is for a different competition')
      }
    } else {
      competitionId = input.competitionId
    }

    // Already registered for this competition? Report it instead of erroring.
    const existing = await getUserTeamForCompetition(userId, competitionId)
    if (existing) {
      return NextResponse.json(
        {
          message: 'You are already participating in this competition',
          team: existing,
          alreadyJoined: true,
        },
        { status: 200 },
      )
    }

    await requireOpenCompetition(competitionId)

    if (input.action === 'CREATE') {
      const team = await createTeam({
        name: input.teamName,
        leaderId: userId,
        competitionId,
      })
      void cacheDel(cacheKeys.userTeams(userId))
      return NextResponse.json(team, { status: 201 })
    }

    // JOIN — file a request, don't add to members directly.
    if (joinTeam.isFinalized) {
      throw new ConflictError('Team is finalized — cannot request to join')
    }
    const req = await createJoinRequest({
      teamId: String(joinTeam._id),
      userId,
    })

    return NextResponse.json(
      {
        pending: true,
        requestId: req._id,
        teamId: joinTeam._id,
        teamName: joinTeam.name,
        message:
          'Request sent — the team leader will review and approve or reject it.',
      },
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
