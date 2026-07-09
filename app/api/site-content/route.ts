import { NextRequest, NextResponse } from 'next/server'
import { getAllSectionContent, upsertSectionContent } from '@/lib/models/site-content'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret')
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { sectionId, content } = await req.json()
  if (!sectionId || !content) {
    return NextResponse.json({ error: 'sectionId and content required' }, { status: 400 })
  }

  const updated = await upsertSectionContent(sectionId, content)
  return NextResponse.json(updated)
}
