import { NextRequest, NextResponse } from 'next/server'
import { deleteTeamById, getTeamById } from '@/lib/models/team'
import { getSession } from '@/lib/auth-guard'
import { ObjectIdSchema } from '@/lib/validation'
import { AuthError, ForbiddenError, NotFoundError, handleApiError } from '@/lib/errors'
import { cacheDel, cacheKeys } from '@/lib/redis'

type Props = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

/**
 * GET /api/teams/[id]
 * Visible to the team's own members and to admins only. (Previously ANY signed-in
 * user could read any team's member emails by guessing an id, and a pure admin —
 * who has no student session — got a 401.) Admins additionally receive members'
 * phone / roll number / department / college.
 */
export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { userId, isAdmin } = await getSession()
    if (!userId && !isAdmin) throw new AuthError()
    const { id } = await params
    ObjectIdSchema.parse(id)

    const team = await getTeamById(id, { adminView: isAdmin })
    if (!team) throw new NotFoundError('Team not found')

    if (!isAdmin) {
      const isMember = (team.members ?? []).some((m: any) => String(m._id) === userId)
      if (!isMember) throw new ForbiddenError('You are not a member of this team')
    }
    return NextResponse.json(team)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/teams/[id]
 * Leader can delete their own team (unless it's approved).
 * Admin can delete any team at any status — with or without a student session.
 * Cascade: pulls team from all project.teamIds, deletes pending invitations
 * and pending join requests.
 */
export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { userId, isAdmin } = await getSession()
    if (!userId && !isAdmin) throw new AuthError()

    const { id: teamId } = await params
    ObjectIdSchema.parse(teamId)

    const existing = await getTeamById(teamId)
    if (!existing) throw new NotFoundError('Team not found')

    const { memberIds } = await deleteTeamById(teamId, userId ?? '', isAdmin)

    void cacheDel(
      cacheKeys.team(teamId),
      ...memberIds.map((id) => cacheKeys.userTeams(id)),
    )

    return NextResponse.json({ message: 'Team deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
