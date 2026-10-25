import { NextRequest, NextResponse } from 'next/server'
import { getAllSectionContent, upsertSectionContent } from '@/lib/models/site-content'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guard'
import { handleApiError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  const sectionId = req.nextUrl.searchParams.get('sectionId')

  if (sectionId) {
    const { getSectionContent } = await import('@/lib/models/site-content')
    const section = await getSectionContent(sectionId)
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    return NextResponse.json(section)
  }

  const sections = await getAllSectionContent()
  return NextResponse.json(sections)
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const { sectionId, content } = z
      .object({ sectionId: z.string().regex(/^[a-z0-9-]{1,50}$/), content: z.record(z.any()) })
      .parse(await req.json())
    return NextResponse.json(await upsertSectionContent(sectionId, content))
  } catch (error) {
    return handleApiError(error)
  }
}
