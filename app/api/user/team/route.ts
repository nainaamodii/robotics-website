import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-utils"
import { getAllTeamsForUser } from "@/lib/models/team" // Import the new function

export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch ALL teams instead of just the latest
        const teams = await getAllTeamsForUser(userId)

        return NextResponse.json(teams)
    } catch (error) {
        console.error("Failed to fetch user teams:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}