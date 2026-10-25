import { NextRequest, NextResponse } from 'next/server'
import { acceptInvitation } from '@/lib/models/invitation'
import { requireVerifiedUser } from '@/lib/auth-guard'
import { ObjectIdSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { cacheDel, cacheKeys } from '@/lib/redis'

type Props = { params: Promise<{ id: string }> }

/**
 * POST /api/invitations/[id]/accept
 * Invitee accepts — adds them to the team and marks invite as accepted.
 * Model layer validates ownership + team state.
 */
export async function POST(_request: NextRequest, { params }: Props) {
  try {
    const userId = await requireVerifiedUser()
    const { id: invitationId } = await params
    ObjectIdSchema.parse(invitationId)

    const { teamId, memberIds } = await acceptInvitation(invitationId, userId)

    // Bust caches: the team + user-teams for every current member.
    void cacheDel(
      cacheKeys.team(teamId),
      ...memberIds.map((id) => cacheKeys.userTeams(id)),
    )

    return NextResponse.json({ message: 'Invitation accepted', teamId })
  } catch (error) {
    return handleApiError(error)
  }
}
