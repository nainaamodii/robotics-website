import { NextRequest, NextResponse } from 'next/server'
import { getSectionContent, upsertSectionContent } from '@/lib/models/site-content'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { sectionId } = await params
  const section = await getSectionContent(sectionId)
  if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })
  return NextResponse.json(section)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret')
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { sectionId } = await params
  const { content } = await req.json()
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const updated = await upsertSectionContent(sectionId, content)
  return NextResponse.json(updated)
}
