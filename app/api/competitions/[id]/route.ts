import { NextRequest, NextResponse } from "next/server"
import { updateCompetition, deleteCompetition } from "@/lib/models/competition"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()

        const { _id, ...updateData } = body;

        const result = await updateCompetition(id, updateData)
        return NextResponse.json(result)
    } catch (error) {
        console.error("Update competition error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const success = await deleteCompetition(id)
        if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json({ message: "Deleted" })
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}