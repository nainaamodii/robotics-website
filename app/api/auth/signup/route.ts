import { NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/models/user"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, rollNo, department } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const user = await createUser({
      email,
      password,
      name,
      rollNo,
      department,
    })

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
        message: "User created successfully",
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
