import { NextRequest, NextResponse } from "next/server"
import { updateEvent, deleteEvent } from "@/lib/models/events"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const result = await updateEvent(id, body)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const success = await deleteEvent(id)
        if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json({ message: "Deleted" })
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}