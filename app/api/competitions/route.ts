import { NextRequest, NextResponse } from 'next/server'
import { createCompetition, getCompetitionsByEvent } from '@/lib/models/competition'
import { getEventById, isPublished } from '@/lib/models/events'
import { isAdmin, requireAdmin } from '@/lib/auth-guard'
import { CreateCompetitionSchema, ObjectIdSchema } from '@/lib/validation'
import { NotFoundError, handleApiError } from '@/lib/errors'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * GET /api/competitions?eventId=... — competitions of an event.
 * Competitions of an unpublished (draft) event are returned as an empty list
 * to everyone except admins, so drafts don't leak.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    ObjectIdSchema.parse(eventId)
    const event = await getEventById(eventId)
    if (!event || (!isPublished(event as any) && !(await isAdmin()))) {
      return NextResponse.json([])
    }
    const competitions = await getCompetitionsByEvent(eventId)
    return NextResponse.json(competitions)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = CreateCompetitionSchema.parse(await request.json())
    // Don't create orphan competitions pointing at a non-existent event.
    const event = await getEventById(body.eventId)
    if (!event) throw new NotFoundError('Event not found')
    // Model expects eventId as ObjectId, not string. Convert at the boundary.
    const result = await createCompetition({
      ...body,
      eventId: new ObjectId(body.eventId),
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
