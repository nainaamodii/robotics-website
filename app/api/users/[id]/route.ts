import { NextRequest, NextResponse } from "next/server"
import { getUserById, updateUser } from "@/lib/models/user"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserById(params.id)
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
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const user = await updateUser(params.id, body)
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
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
