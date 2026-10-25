import { NextResponse } from 'next/server'
import { getAdminEvents } from '@/lib/models/events'
import { requireAdmin } from '@/lib/auth-guard'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/events — every event (drafts included) with its competitions
 * and live registration counts (teams, members, teams awaiting review).
 * Never cached: new student registrations must show up immediately.
 */
export async function GET() {
  try {
    await requireAdmin()
    const events = await getAdminEvents()
    const res = NextResponse.json(events)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    return handleApiError(error)
  }
}
