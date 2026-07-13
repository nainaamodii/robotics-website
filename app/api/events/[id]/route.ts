import { NextRequest, NextResponse } from "next/server"
import { getEventById, updateEvent, deleteEvent } from "@/lib/models/events"
import { requireAdmin } from "@/lib/auth-guard"
import { handleApiError, NotFoundError } from "@/lib/errors"
import { ObjectIdSchema, UpdateEventSchema } from "@/lib/validation"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    ObjectIdSchema.parse(id)
    const body = UpdateEventSchema.parse(await request.json())
    const result = await updateEvent(id, body)
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
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const event = await getEventById(id)
        if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(event)
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
    }
}