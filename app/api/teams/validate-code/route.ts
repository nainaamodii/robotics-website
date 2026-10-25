import { NextRequest, NextResponse } from 'next/server'
import { getTeamByCode } from '@/lib/models/team'
import { requireUser } from '@/lib/auth-guard'
import { handleApiError } from '@/lib/errors'
import { enforceLimit, teamCodeLimiter } from '@/lib/rate-limit'
import { getCompetitionContext, registrationBlockReason } from '@/lib/registration'

export const dynamic = 'force-dynamic'

/**
 * GET /api/teams/validate-code?code=ABC123[&competitionId=...]
 *
 * The registration wizard uses this to preview the team name before letting
 * the user commit to joining. Always returns 200 with `valid: true|false` and a
 * `reason` ('malformed' | 'not_found' | 'wrong_competition' | 'closed' |
 * 'finalized' | 'full') so the UI can explain precisely what's wrong.
 *
 * Auth required and rate limited (30/min/user) so codes can't be enumerated.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUser()
    await enforceLimit(teamCodeLimiter(), userId)

    const rawCode = request.nextUrl.searchParams.get('code') ?? ''
    const code = rawCode.trim().toUpperCase()
    const expectedCompetition = request.nextUrl.searchParams.get('competitionId')

    // Cheap gate — team codes are 6 alphanumeric chars in the current nanoid
    // config. Reject anything else without hitting the DB.
    if (!/^[A-Z0-9]{4,10}$/.test(code)) {
      return NextResponse.json({ valid: false, reason: 'malformed' })
    }

    const team = await getTeamByCode(code)
    if (!team) {
      return NextResponse.json({ valid: false, reason: 'not_found' })
    }

    const teamCompetitionId = String((team as any).competitionId ?? '')
    if (expectedCompetition && expectedCompetition !== teamCompetitionId) {
      return NextResponse.json({ valid: false, reason: 'wrong_competition' })
    }

    if (team.isFinalized) {
      return NextResponse.json({ valid: false, reason: 'finalized', teamName: team.name })
    }

    const ctx = await getCompetitionContext(teamCompetitionId)
    if (ctx && registrationBlockReason(ctx)) {
      return NextResponse.json({ valid: false, reason: 'closed', teamName: team.name })
    }

    const memberCount = Array.isArray(team.members) ? team.members.length : 0
    const max = ctx?.competition?.maxTeamSize
    if (typeof max === 'number' && memberCount >= max) {
      return NextResponse.json({ valid: false, reason: 'full', teamName: team.name })
    }

    return NextResponse.json({
      valid: true,
      teamName: team.name,
      memberCount,
      maxTeamSize: typeof max === 'number' ? max : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
