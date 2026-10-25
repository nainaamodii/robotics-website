import { NextResponse } from 'next/server'
import { listTeamsByStatus } from '@/lib/models/team'
import { requireAdmin } from '@/lib/auth-guard'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/participations — every team/registration, newest first, with
 * leader, competition (incl. min/max size) and event populated. Reads the DB
 * directly (no cache) so a student's new registration is visible immediately.
 */
export async function GET() {
  try {
    await requireAdmin()
    const participations = await listTeamsByStatus(undefined, { sort: 'recent' })
    const res = NextResponse.json(participations)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    return handleApiError(error)
  }
}
