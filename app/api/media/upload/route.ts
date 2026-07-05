import { type NextRequest, NextResponse } from "next/server"
import { createMedia } from "@/lib/models/media"
import { ObjectId } from "mongodb"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 1. Check Env Var availability
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    if (!uploadPreset || !cloudName) {
      console.error("[v0] Missing Config:", { uploadPreset: !!uploadPreset, cloudName: !!cloudName })
      return NextResponse.json({ error: "Server misconfiguration: Missing Cloudinary credentials" }, { status: 500 })
    }

    console.log("[v0] Uploading with preset:", uploadPreset)

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    // Create FormData for Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("file", blob, file.name)
    cloudinaryFormData.append("upload_preset", uploadPreset)
    cloudinaryFormData.append("folder", "robotics-club")

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json().catch(() => ({ error: "Unknown error" }))
      console.error("[v0] Cloudinary raw error:", errorData)
      return NextResponse.json({
        error: `Cloudinary error: ${errorData?.error?.message || "Check preset name and signing mode"}`
      }, { status: 500 })
    }

    const uploadResult = await cloudinaryResponse.json()

    // Get Auth User
    let userId = new ObjectId("000000000000000000000000")
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get("auth_token")?.value
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any
        userId = new ObjectId(decoded.userId)
      }
    } catch (e) { /* ignore auth error */ }

    // Save to DB
    const media = await createMedia({
      filename: file.name,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      uploadedBy: userId,
      fileSize: buffer.byteLength,
      mimeType: file.type,
    })

    return NextResponse.json({ ...media, url: media.cloudinaryUrl }, { status: 201 })

  } catch (error) {
    console.error("[v0] Upload Route Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}