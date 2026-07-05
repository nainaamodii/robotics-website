import { NextRequest, NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-utils"
import { createTeam, joinTeamByCode, getUserTeamForCompetition } from "@/lib/models/team"

export async function POST(request: NextRequest) {
    const userId = await getAuthUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { action, competitionId, teamName, teamCode } = await request.json()

    try {
        if (competitionId) {
            const existingTeam = await getUserTeamForCompetition(userId, competitionId);
            if (existingTeam) {
                // If found, return it immediately with a specific status
                return NextResponse.json({
                    message: "You are already participating in this competition",
                    team: existingTeam,
                    alreadyJoined: true
                }, { status: 200 });
            }
        }

        if (action === "CREATE") {
            if (!teamName) return NextResponse.json({ error: "Team name required" }, { status: 400 })
            const team = await createTeam({ name: teamName, leaderId: userId, competitionId })
            return NextResponse.json(team, { status: 201 })
        }

        if (action === "JOIN") {
            if (!teamCode) return NextResponse.json({ error: "Team code required" }, { status: 400 })

            // Note: We might want to check if the team they are joining belongs to the right competition
            // But usually the code is unique enough.

            const result = await joinTeamByCode(userId, teamCode.toUpperCase())
            const team = result.value ? result.value : result;

            if (!team) return NextResponse.json({ error: "Invalid code or team full" }, { status: 404 })

            // Check if this team belongs to the current competition context (optional but good for safety)
            if (competitionId && team.competitionId.toString() !== competitionId) {
                return NextResponse.json({ error: "This code is for a different competition" }, { status: 400 })
            }

            return NextResponse.json(team, { status: 200 })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error: any) {
        console.error("Participate Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}