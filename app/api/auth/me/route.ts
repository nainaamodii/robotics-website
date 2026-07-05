import { NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/models/user"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any
    const user = await getUserById(decoded.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      rollNo: user.rollNo,
      department: user.department,
      phone: user.phone,
      profileImage: user.profileImage,
      bio: user.bio,
      teamId: user.teamId,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
