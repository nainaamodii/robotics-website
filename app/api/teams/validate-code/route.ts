import { NextRequest, NextResponse } from 'next/server'
import { connectDB, getDB } from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ valid: false })

  await connectDB()
  const db = getDB()
  const team = await db.collection('teams').findOne({ teamCode: code })

  if (!team) return NextResponse.json({ valid: false })
  return NextResponse.json({ valid: true, teamName: team.name })
}
