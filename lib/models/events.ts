import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'

export interface Event {
    _id?: ObjectId
    name: string
    year: number // Extracted from date or name
    // New UI fields
    theme: string
    tagline: string
    description: string
    date: string // "OCT 24 - 26, 2025"
    location: string
    participantsLabel: string // "500+ Engineers"
    highlights: string[]

    isActive: boolean
    competitions: ObjectId[]
    createdAt: Date
}

export async function createEvent(eventData: Omit<Event, '_id' | 'competitions' | 'createdAt'>) {
    const db = await getDB()
    const newEvent: Event = {
        ...eventData,
        competitions: [],
        isActive: true,
        createdAt: new Date(),
    }
    return db.collection('events').insertOne(newEvent)
}

export async function getEventByName(name: string) {
    const db = await getDB()
    return db.collection('events').findOne({ name })
}


export async function getEventById(id: string) {
    const db = await getDB()
    return db.collection('events').findOne({ _id: new ObjectId(id) })
}

export async function getAllEvents() {
    const db = await getDB()
    return db.collection('events').aggregate([
        {
            $lookup: {
                from: "competitions",
                localField: "competitions",
                foreignField: "_id",
                as: "competitionsList" // Store populated array here
            }
        },
        // Overwrite the original ID array with the populated object array
        {
            $addFields: {
                competitions: "$competitionsList"
            }
        },
        // Remove the temporary field
        {
            $project: {
                competitionsList: 0
            }
        }
    ]).toArray()
}

export async function updateEvent(id: string, updates: Partial<Event>) {
    const db = await getDB()
    const result = await db.collection('events').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
    )
    return result
}

export async function deleteEvent(id: string) {
    const db = await getDB()
    const eventId = new ObjectId(id)

    // 1. Find the event to get its competitions
    const event = await db.collection('events').findOne({ _id: eventId })

    if (event && event.competitions && event.competitions.length > 0) {
        // 2. Delete all associated competitions
        await db.collection('competitions').deleteMany({
            _id: { $in: event.competitions }
        })
    }

    const result = await db.collection('events').deleteOne({ _id: eventId })
    return result.deletedCount > 0
}

