import { NextRequest, NextResponse } from "next/server"
import { getCompetitionById, updateCompetition, deleteCompetition } from "@/lib/models/competition"
import { requireAdmin } from "@/lib/auth-guard"
import { handleApiError, NotFoundError } from "@/lib/errors"
import { ObjectIdSchema, UpdateCompetitionSchema } from "@/lib/validation"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const competition = await getCompetitionById(id)
        if (!competition) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(competition)
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    ObjectIdSchema.parse(id)
    const body = UpdateCompetitionSchema.parse(await request.json())
    const result = await updateCompetition(id, body)
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
    const ok = await deleteCompetition(id)
    if (!ok) throw new NotFoundError('Competition not found')
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
