import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getEventById, updateEvent, deleteEvent, isPublished } from "@/lib/models/events"
import { isAdmin, requireAdmin } from "@/lib/auth-guard"
import { handleApiError, NotFoundError } from "@/lib/errors"
import { ObjectIdSchema, UpdateEventSchema } from "@/lib/validation"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    ObjectIdSchema.parse(id)
    const body = UpdateEventSchema.parse(await request.json())
    const result = await updateEvent(id, body)
    // Same fix as competitions PUT — null result means "not found", not "no-op".
    if (!result) throw new NotFoundError('Event not found')
    revalidatePath('/api/events')
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    ObjectIdSchema.parse(id)
    const ok = await deleteEvent(id)
    if (!ok) throw new NotFoundError('Event not found')
    revalidatePath('/api/events')
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}

/** Drafts are only visible to admins; everyone else gets a 404 (no existence leak). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        ObjectIdSchema.parse(id)
        const event = await getEventById(id)
        if (!event || (!isPublished(event as any) && !(await isAdmin()))) {
            throw new NotFoundError('Event not found')
        }
        return NextResponse.json(event)
    } catch (error) {
        return handleApiError(error)
    }
}
