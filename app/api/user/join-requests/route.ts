import { NextResponse } from 'next/server'
import { getPendingRequestsByUser } from '@/lib/models/join-request'
import { requireUser } from '@/lib/auth-guard'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/join-requests
 * The signed-in student's own pending "join team" requests (waiting on a
 * leader). Lets the profile page show registrations that aren't yet a roster spot.
 */
export async function GET() {
  try {
    const userId = await requireUser()
    return NextResponse.json(await getPendingRequestsByUser(userId))
  } catch (error) {
    return handleApiError(error)
  }
}
