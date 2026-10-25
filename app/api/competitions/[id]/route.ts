import { NextRequest, NextResponse } from "next/server"
import {
  getCompetitionById,
  updateCompetition,
  deleteCompetition,
  countTeamsLargerThan,
} from "@/lib/models/competition"
import { isPublished } from "@/lib/models/events"
import { getCompetitionContext } from "@/lib/registration"
import { isAdmin, requireAdmin } from "@/lib/auth-guard"
import { ConflictError, handleApiError, NotFoundError, ValidationError } from "@/lib/errors"
import { ObjectIdSchema, UpdateCompetitionSchema } from "@/lib/validation"

export const dynamic = 'force-dynamic'

/** Competitions of draft events are hidden from everyone except admins. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        ObjectIdSchema.parse(id)
        const ctx = await getCompetitionContext(id)
        if (!ctx || (!isPublished(ctx.event) && !(await isAdmin()))) {
            throw new NotFoundError('Competition not found')
        }
        return NextResponse.json(ctx.competition)
    } catch (error) {
        return handleApiError(error)
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    ObjectIdSchema.parse(id)
    const body = UpdateCompetitionSchema.parse(await request.json())

    const existing = await getCompetitionById(id)
    if (!existing) throw new NotFoundError('Competition not found')

    // The schema can only compare min/max when both are sent; validate the
    // MERGED values so updating just one of them can't invert the range.
    const min = body.minTeamSize ?? existing.minTeamSize
    const max = body.maxTeamSize ?? existing.maxTeamSize
    if (typeof min === 'number' && typeof max === 'number' && max < min) {
      throw new ValidationError({
        formErrors: [],
        fieldErrors: { maxTeamSize: ['maxTeamSize must be >= minTeamSize'] },
      })
    }

    // Don't strand existing teams: refuse to lower the cap below a roster that exists.
    if (body.maxTeamSize !== undefined && body.maxTeamSize < existing.maxTeamSize) {
      const tooBig = await countTeamsLargerThan(id, body.maxTeamSize)
      if (tooBig > 0) {
        throw new ConflictError(
          `${tooBig} existing team${tooBig === 1 ? ' has' : 's have'} more than ${body.maxTeamSize} members — ` +
          'remove members before lowering the maximum.',
        )
      }
    }

    const result = await updateCompetition(id, body)
    if (!result) throw new NotFoundError('Competition not found')
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
