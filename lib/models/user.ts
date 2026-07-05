import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { getDB } from '@/lib/db'

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  rollNo?: string
  department: string
  createdAt: Date
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt'>) {
  const db = await getDB()
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const newUser: User = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
  }

  const result = await db.collection('users').insertOne(newUser)
  return { ...newUser, _id: result.insertedId }
}

export async function getUserById(id: string | ObjectId) {
  const db = await getDB()
  return db.collection('users').findOne({ _id: new ObjectId(id) })
}

export async function getUserByEmail(email: string) {
  const db = await getDB()
  return db.collection('users').findOne({ email })
}

// To see invites, we query the TEAMS collection, not the User collection
export async function getUserInvitations(userId: string) {
  const db = await getDB()
  return db.collection('teams').aggregate([
    { $match: { invitations: new ObjectId(userId) } },
    {
      $lookup: {
        from: "competitions",
        localField: "competitionId",
        foreignField: "_id",
        as: "competition"
      }
    },
    { $unwind: "$competition" },
    {
      $project: {
        "teamName": "$name",
        "competitionName": "$competition.name",
        "leader": "$leader"
      }
    }
  ]).toArray()
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function updateUser(id: string | ObjectId, updates: Partial<User>) {
  const db = await getDB()

  const { _id, ...safeUpdates } = updates as any

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: safeUpdates },
    { returnDocument: 'after' }
  )

  return result.value || result
}