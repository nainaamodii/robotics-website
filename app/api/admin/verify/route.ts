import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No admin token" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any

    if (!decoded.admin) {
      return NextResponse.json({ error: "Not admin" }, { status: 401 })
    }

    return NextResponse.json({ authorized: true })
  } catch (error) {
    console.error("Admin verify error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
