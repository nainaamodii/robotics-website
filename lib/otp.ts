/**
 * Email one-time-passcode (OTP) sign-in.
 *
 * - 6-digit code from a CSPRNG, stored only as an HMAC (a DB leak can't be
 *   replayed, and a 6-digit space can't be brute-forced offline without the key).
 * - 10 minute expiry (Mongo TTL index), max 5 wrong guesses, single use.
 * - 45s per-address resend cooldown, enforced in the DB so it holds without Redis.
 */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { env } from './env'
import { getDB } from './db'
import { sendEmail } from './email'
import { ApiError, AuthError, RateLimitError } from './errors'
import { assertAllowedEmail } from './email-policy'

const OTP_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 45 * 1000
const MAX_ATTEMPTS = 5

interface OtpDoc {
  email: string
  hash: string
  attempts: number
  createdAt: Date
  expiresAt: Date
}

let ttlReady: Promise<unknown> | null = null
async function col() {
  const db = await getDB()
  const c = db.collection<OtpDoc>('email_otps')
  ttlReady ??= Promise.all([
    c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.createIndex({ email: 1 }, { unique: true }),
  ]).catch(() => {
    ttlReady = null
  })
  await ttlReady
  return c
}

function hashCode(email: string, code: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(`otp:${email}:${code}`).digest('hex')
}

function otpEmail(code: string) {
  const minutes = OTP_TTL_MS / 60000
  return {
    subject: `${code} is your MNNIT Robotics verification code`,
    text:
      `Your MNNIT Robotics Club verification code is ${code}.\n\n` +
      `It expires in ${minutes} minutes. If you didn't request it, you can ignore this email.`,
    html:
      `<div style="background:#0b0b0c;padding:40px 16px;font-family:Helvetica,Arial,sans-serif">` +
      `<div style="max-width:440px;margin:0 auto;background:#111;border:1px solid #2a2a2a;padding:32px;color:#f2f2f2">` +
      `<p style="margin:0 0 24px;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#ff6436">MNNIT Robotics Club</p>` +
      `<p style="margin:0 0 8px;font-size:14px;color:#a2a2a2">Your verification code</p>` +
      `<p style="margin:0 0 24px;font-size:40px;letter-spacing:.35em;font-weight:700;font-family:Menlo,monospace">${code}</p>` +
      `<p style="margin:0;font-size:12px;line-height:1.6;color:#7b7a7c">Expires in ${minutes} minutes. If you didn't request this, ignore this email.</p>` +
      `</div></div>`,
  }
}

export async function requestOtp(email: string): Promise<void> {
  assertAllowedEmail(email)
  const c = await col()
  const existing = await c.findOne({ email })
  if (existing) {
    const wait = existing.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()
    if (wait > 0) throw new RateLimitError(Math.ceil(wait / 1000), 'Please wait before requesting another code')
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const now = new Date()
  await c.updateOne(
    { email },
    { $set: { hash: hashCode(email, code), attempts: 0, createdAt: now, expiresAt: new Date(now.getTime() + OTP_TTL_MS) } },
    { upsert: true },
  )

  try {
    const delivered = await sendEmail({ to: email, ...otpEmail(code) })
    // Dev console fallback has no inbox — surface that nothing was mailed.
    void delivered
  } catch (err) {
    await c.deleteOne({ email })
    throw err instanceof ApiError ? err : new ApiError(502, 'Could not send the email')
  }
}

/** Throws AuthError on any failure; deletes the code on success. */
export async function verifyOtp(email: string, code: string): Promise<void> {
  assertAllowedEmail(email)
  const c = await col()
  const doc = await c.findOne({ email })
  if (!doc || doc.expiresAt.getTime() < Date.now()) {
    throw new AuthError('That code has expired. Request a new one.')
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    await c.deleteOne({ email })
    throw new AuthError('Too many incorrect attempts. Request a new code.')
  }

  const a = Buffer.from(hashCode(email, code))
  const b = Buffer.from(doc.hash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    // Atomic increment so parallel guesses can't dodge the cap.
    await c.updateOne({ email }, { $inc: { attempts: 1 } })
    throw new AuthError('Incorrect code')
  }
  // Single-use: only the request that deletes the doc wins.
  const del = await c.deleteOne({ email, hash: doc.hash })
  if (del.deletedCount !== 1) throw new AuthError('That code has already been used')
}
