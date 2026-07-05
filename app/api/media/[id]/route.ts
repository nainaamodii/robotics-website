import { type NextRequest, NextResponse } from "next/server"
import { getMediaById, deleteMedia } from "@/lib/models/media"
import { ObjectId } from "mongodb"

// Update the type definition to treat params as a Promise
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // FIX: Await the params object before accessing id
    const { id } = await params

    console.log("[v0] Request to delete media ID:", id)

    // 1. Validate ID format
    if (!id || !ObjectId.isValid(id)) {
      console.error("[v0] Invalid ID format received:", id)
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // 2. Get the media record from DB to find the Cloudinary Public ID
    const media = await getMediaById(id)

    if (!media) {
      console.warn("[v0] Media not found in DB during delete request. ID:", id)
      return NextResponse.json({ message: "Media already deleted" }, { status: 200 })
    }

    // 3. Delete from Cloudinary (using Admin API)
    if (media.cloudinaryPublicId) {
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

      if (apiKey && apiSecret && cloudName) {
        // Create Basic Auth header
        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

        // Pass public_ids[] as a query parameter
        const queryParams = new URLSearchParams()
        queryParams.append("public_ids[]", media.cloudinaryPublicId)

        console.log("[v0] Deleting from Cloudinary:", media.cloudinaryPublicId)

        const deleteResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${queryParams.toString()}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Basic ${auth}`,
            },
          }
        )

        if (!deleteResponse.ok) {
          console.error("[v0] Cloudinary API error:", await deleteResponse.text())
          // We continue to delete from DB even if Cloudinary fails
        } else {
          console.log("[v0] Cloudinary delete success")
        }
      } else {
        console.warn("[v0] Missing Cloudinary API keys, skipping cloud delete")
      }
    }

    // 4. Delete from Database
    console.log("[v0] Deleting from MongoDB...")
    const success = await deleteMedia(id)

    if (!success) {
      console.error("[v0] MongoDB delete returned false for ID:", id)
      return NextResponse.json({ error: "Database delete failed" }, { status: 500 })
    }

    console.log("[v0] Media deleted successfully from all sources")
    return NextResponse.json({ message: "Media deleted successfully" })

  } catch (error) {
    console.error("[v0] Critical Delete Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}