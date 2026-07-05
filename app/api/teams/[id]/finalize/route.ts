// app/api/teams/[id]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-utils"
import { finalizeTeam } from "@/lib/models/team"

type Props = {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    try {
        // 1. Get the authenticated user ID from your custom JWT
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized: No active session" }, { status: 401 })
        }

        // 2. Await params (Next.js 15 requirement)
        const { id: teamId } = await params

        // 3. Trigger the finalize logic in the model
        // This function checks if the userId matches the leaderId of the team
        const updatedTeam = await finalizeTeam(teamId, userId)

        return NextResponse.json({
            message: "Protocol Finalized: Team Deployment Confirmed",
            team: updatedTeam
        }, { status: 200 })

    } catch (error: any) {
        console.error("[FINALIZATION_ERROR]:", error.message)

        // Handle unauthorized leader access or missing team
        if (error.message.includes("Unauthorized")) {
            return NextResponse.json({ error: "Access Denied: Only the Team Leader can finalize registration" }, { status: 403 })
        }

        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}