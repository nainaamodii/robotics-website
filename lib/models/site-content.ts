import { getDB, connectDB } from '../db'

export interface SiteContent {
  sectionId: string
  content: Record<string, any>
  updatedAt: Date
}

async function collection() {
  await connectDB()
  return getDB().collection<SiteContent>('site_content')
}

export async function getSectionContent(sectionId: string): Promise<SiteContent | null> {
  const col = await collection()
  return col.findOne({ sectionId })
}

export async function getAllSectionContent(): Promise<SiteContent[]> {
  const col = await collection()
  return col.find({}).toArray()
}

export async function upsertSectionContent(sectionId: string, content: Record<string, any>): Promise<SiteContent> {
  const col = await collection()
  const now = new Date()
  await col.updateOne(
    { sectionId },
    { $set: { content, updatedAt: now } },
    { upsert: true }
  )
  return { sectionId, content, updatedAt: now }
}
