/**
 * MongoDB connection singleton with two properties that matter:
 *
 * 1. `globalThis` cache — Next.js dev mode does Hot Module Replacement, which
 *    re-imports this file constantly. A module-level `let client` gets reset
 *    every time, leaking connections. Attaching to `globalThis` survives HMR.
 *    In serverless (Vercel), the same trick reuses the client across warm
 *    invocations of the same Lambda container.
 *
 * 2. Connection pool tuning — MongoClient defaults are conservative for a Node
 *    server. We bump `maxPoolSize` a bit and set aggressive timeouts so a
 *    single slow query can't stall the whole pool.
 *
 * Every model calls `getDB()` — it's cheap after the first call because the
 * client is already connected.
 */
import { Db, MongoClient, MongoClientOptions } from 'mongodb'
import { env } from './env'

// Extend the Node global so TS knows about our cache field.
declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

// Overridable so integration tests can run against a throwaway database
// (never point tests at the production DB name).
const DB_NAME = process.env.MONGO_DB_NAME || 'robotics-club'

const options: MongoClientOptions = {
  // Pool sizing: enough for burst traffic, not so many that we exhaust Atlas
  // connection limits (free tier caps at 500).
  maxPoolSize: 20,
  minPoolSize: 2,
  // Fail fast on flaky networks rather than hanging the request.
  serverSelectionTimeoutMS: 3_000,
  connectTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  retryWrites: true,
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(env.MONGO_URL, options)
    // Kick off connect immediately; every getDB() awaits the same promise.
    globalThis.__mongoClientPromise = client.connect()
  }
  return globalThis.__mongoClientPromise
}

export async function getDB(): Promise<Db> {
  const client = await getClientPromise()
  return client.db(DB_NAME)
}

/** Backward-compat alias — same as getDB(). */
export const connectDB = getDB
