import { NextRequest, NextResponse } from "next/server"
import { getTeamById } from "@/lib/models/team"

// Next.js 15 requires awaiting params
type Props = {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { id } = await params;

        const team = await getTeamById(id);

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        return NextResponse.json(team);
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}