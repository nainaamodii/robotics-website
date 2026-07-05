import { NextResponse } from "next/server"
import { getAllMedia } from "@/lib/models/media"

export async function GET() {
  try {
    console.log("[v0] Fetching all media")
    const allMedia = await getAllMedia()

    // Map fields to match UI expectations
    const mappedMedia = allMedia.map((item: any) => ({
      _id: item._id,
      filename: item.filename,
      url: item.cloudinaryUrl,
      cloudinaryId: item.cloudinaryPublicId,
      uploadedAt: item.createdAt,
      size: item.fileSize,
    }))

    console.log("[v0] Found", mappedMedia.length, "media items")
    return NextResponse.json(mappedMedia)
  } catch (error) {
    console.error("[v0] Failed to fetch media:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
