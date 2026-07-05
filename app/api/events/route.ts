import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, createEvent } from '@/lib/models/events';

export async function GET() {
    try {
        const events = await getAllEvents();
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Basic validation
        if (!body.name || !body.date) {
            return NextResponse.json({ error: 'Name and Date are required' }, { status: 400 });
        }

        const result = await createEvent(body);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Create event error:", error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}