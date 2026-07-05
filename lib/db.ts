import { MongoClient } from 'mongodb'

let mongoClient: MongoClient | null = null
let db: any = null

export async function connectDB() {
  if (db) return db

  const mongoUrl = process.env.MONGO_URL
  if (!mongoUrl) {
    throw new Error('MONGO_URL environment variable is not set')
  }

  mongoClient = new MongoClient(mongoUrl)
  await mongoClient.connect()
  db = mongoClient.db('robotics_club')

  return db
}

export async function getDB() {
  if (!db) {
    await connectDB()
  }
  return db
}
