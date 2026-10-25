import { ObjectId } from 'mongodb'
import { getDB } from '@/lib/db'
import { ConflictError } from '@/lib/errors'

export interface User {
  _id?: ObjectId
  email: string
  password?: string
  name: string
  rollNo?: string
  department: string
  phone?: string
  college?: string
  isMnnit?: boolean
  isProfileComplete?: boolean
  profileImage?: string
  bio?: string
  teamId?: ObjectId
  role?: 'user' | 'admin'
  emailVerified?: boolean
  emailVerifiedAt?: Date
  codename?: string
  createdAt: Date
}

export async function getUserById(id: string | ObjectId) {
  const db = await getDB()
  return db.collection('users').findOne({ _id: new ObjectId(id) })
}

export async function getUserByEmail(email: string) {
  const db = await getDB()
  return db.collection('users').findOne({ email })
}

/** Lookup by exact codename. Codenames are stored lowercase; normalize input. */
export async function getUserByCodename(codename: string) {
  const db = await getDB()
  return db.collection('users').findOne({ codename: codename.toLowerCase() })
}

/**
 * Set the caller's codename. Race-safe via the unique sparse index —
 * two concurrent choices of the same codename lose to E11000, which we
 * translate into a ConflictError.
 *
 * `changeAllowed=false` blocks re-setting once assigned. Right now we DO
 * allow changing (returns updated user), but we log the change so we can
 * revisit if abuse shows up.
 */
export async function setUserCodename(userId: string, codename: string) {
  const db = await getDB()
  const normalized = codename.toLowerCase()
  try {
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { codename: normalized } },
      { returnDocument: 'after' },
    )
    return (result as any)?.value ?? result
  } catch (e: any) {
    if (e?.code === 11000) {
      throw new ConflictError('That codename is already taken')
    }
    throw e
  }
}

/**
 * Prefix search by codename. Used by the leader's "invite by codename" UI.
 * Case-insensitive (codenames are stored lowercase so a simple prefix regex
 * works with the index). Limits results to a small page to keep the query fast.
 */
export async function searchUsersByCodenamePrefix(prefix: string, limit = 10) {
  if (!prefix.trim()) return []
  const db = await getDB()
  const p = prefix.toLowerCase().replace(/[^a-z0-9_]/g, '') // sanitize regex input
  if (!p) return []
  const rx = new RegExp('^' + p)
  return db
    .collection('users')
    .find(
      { codename: rx },
      { projection: { codename: 1, name: 1, profileImage: 1 } },
    )
    .limit(limit)
    .toArray()
}

export async function updateUser(id: string | ObjectId, updates: Partial<User>) {
  const db = await getDB()

  // Strip fields that should never be settable via a generic update — even
  // though the Zod layer already rejects them, defense-in-depth is cheap.
  const { _id, password, createdAt, role, ...safeUpdates } = updates as any

  const result = await db.collection('users').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: safeUpdates },
    { returnDocument: 'after' },
  )

  return (result as any)?.value ?? result
}

/**
 * Called after a successful email OTP. Proves ownership of the address, so the
 * account is (idempotently) marked verified; creates it on first sign-in.
 * Race-safe: a concurrent first sign-in loses to the unique email index and
 * falls back to the document the winner inserted.
 */
export async function findOrCreateVerifiedUser(email: string) {
  const db = await getDB()
  const users = db.collection<User>('users')
  const now = new Date()
  const verify = { $set: { emailVerified: true, emailVerifiedAt: now } }

  const existing = await users.findOneAndUpdate({ email }, verify, { returnDocument: 'after' })
  if (existing) return existing

  const doc: User = {
    email,
    name: email.split('@')[0],
    department: '',
    isProfileComplete: false,
    isMnnit: email.endsWith('@mnnit.ac.in'),
    emailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
  }
  try {
    const result = await users.insertOne(doc)
    return { ...doc, _id: result.insertedId }
  } catch (e: any) {
    if (e?.code === 11000) {
      const raced = await users.findOneAndUpdate({ email }, verify, { returnDocument: 'after' })
      if (raced) return raced
    }
    throw e
  }
}
