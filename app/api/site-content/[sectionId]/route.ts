import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSectionContent, upsertSectionContent } from '@/lib/models/site-content'
import { requireAdmin } from '@/lib/auth-guard'
import { handleApiError } from '@/lib/errors'

const Body = z.object({ content: z.record(z.any()) })
const SectionId = z.string().regex(/^[a-z0-9-]{1,50}$/)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { sectionId } = await params
  try {
    const section = await getSectionContent(sectionId)
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    return NextResponse.json(section)
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    await requireAdmin()
    const sectionId = SectionId.parse((await params).sectionId)
    const { content } = Body.parse(await req.json())
    return NextResponse.json(await upsertSectionContent(sectionId, content))
  } catch (error) {
    return handleApiError(error)
  }
}
