import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function GET() {
    try {
        const db = await getDB()

        // Aggregation pipeline to join teams with users (leader & members) and competitions
        const participations = await db.collection('teams').aggregate([
            {
                $lookup: {
                    from: "competitions",
                    localField: "competitionId",
                    foreignField: "_id",
                    as: "competition"
                }
            },
            { $unwind: { path: "$competition", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "leaderId",
                    foreignField: "_id",
                    as: "leader"
                }
            },
            { $unwind: { path: "$leader", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    teamCode: 1,
                    isFinalized: 1,
                    createdAt: 1,
                    memberCount: { $size: "$members" }, // Count total members
                    competitionName: "$competition.title",
                    leaderName: "$leader.name",
                    leaderEmail: "$leader.email",
                    leaderPhone: "$leader.phone"
                }
            },
            { $sort: { createdAt: -1 } } // Newest first
        ]).toArray()

        return NextResponse.json(participations)
    } catch (error) {
        console.error("Failed to fetch participations:", error)
        return NextResponse.json({ error: "Failed to load data" }, { status: 500 })
    }
}