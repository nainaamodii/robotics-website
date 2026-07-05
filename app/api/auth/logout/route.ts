// app/api/auth/logout/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()

    cookieStore.delete("auth_token")

    cookieStore.set("auth_token", "", { maxAge: 0, path: '/' })

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}