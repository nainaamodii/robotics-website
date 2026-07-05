import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword } from "@/lib/models/user"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = jwt.sign({ userId: user._id?.toString(), email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return NextResponse.json(
      {
        message: "Signed in successfully",
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ error: "Sign in failed" }, { status: 500 })
  }
}
