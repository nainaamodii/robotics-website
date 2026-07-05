import { NextRequest, NextResponse } from 'next/server';
import { getCompetitionsByEvent, createCompetition } from '@/lib/models/competition';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const competitions = await getCompetitionsByEvent(eventId);
        return NextResponse.json(competitions);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.eventId || !body.title) {
            return NextResponse.json({ error: 'Event ID and Title are required' }, { status: 400 });
        }

        const data = {
            ...body,
            eventId: new ObjectId(body.eventId)
        };

        const result = await createCompetition(data);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Create competition error:", error);
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}