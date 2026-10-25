import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createEvent, getAllEvents, withStatus } from '@/lib/models/events'
import { requireAdmin } from '@/lib/auth-guard'
import { CreateEventSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'

// Always read fresh. This used to be cached for 5 minutes, which meant an event
// an admin had just published (or a registration toggle) could take minutes to
// reach students. The dataset is tiny, so a live read is cheap.
export const dynamic = 'force-dynamic'

/**
 * GET /api/events — PUBLIC. Only published events are returned; drafts are
 * invisible here. Admins use GET /api/admin/events to see everything.
 */
export async function GET() {
  try {
    const events = await getAllEvents({ publishedOnly: true })
    const res = NextResponse.json(withStatus(events))
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/events — admin only. New events are created as drafts unless `published: true`. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = CreateEventSchema.parse(await request.json())
    const result = await createEvent(body)
    revalidatePath('/api/events')
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
