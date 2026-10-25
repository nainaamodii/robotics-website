import { getDB } from '../db'
import { decryptSecret, encryptSecret } from '../secret-box'

/**
 * SMTP configuration, managed from the admin dashboard and stored in the
 * `app_settings` collection. The password is encrypted at rest and never
 * returned to the browser.
 */
export interface SmtpSettings {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromEmail: string
  fromName: string
}

interface SmtpDoc extends Omit<SmtpSettings, 'password'> {
  key: 'smtp'
  passwordEnc: string
  updatedAt: Date
}

async function col() {
  const db = await getDB()
  return db.collection<SmtpDoc>('app_settings')
}

/** Full settings including the decrypted password. Server-side use only. */
export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  const doc = await (await col()).findOne({ key: 'smtp' })
  if (!doc) return null
  const password = decryptSecret(doc.passwordEnc)
  if (password === null) return null
  const { key: _k, passwordEnc: _p, updatedAt: _u, _id, ...rest } = doc as any
  return { ...rest, password }
}

/** Safe view for the admin UI — no password, just whether one is stored. */
export async function getSmtpPublic() {
  const doc = await (await col()).findOne({ key: 'smtp' })
  if (!doc) return null
  return {
    host: doc.host,
    port: doc.port,
    secure: doc.secure,
    user: doc.user,
    fromEmail: doc.fromEmail,
    fromName: doc.fromName,
    hasPassword: !!doc.passwordEnc,
    updatedAt: doc.updatedAt,
  }
}

/** `password` undefined/empty keeps the stored one. */
export async function saveSmtpSettings(input: Omit<SmtpSettings, 'password'> & { password?: string }) {
  const c = await col()
  const existing = await c.findOne({ key: 'smtp' })
  const passwordEnc = input.password
    ? encryptSecret(input.password)
    : existing?.passwordEnc
  if (!passwordEnc) throw new Error('A password is required the first time SMTP is configured')
  const { password: _pw, ...rest } = input
  await c.updateOne(
    { key: 'smtp' },
    { $set: { ...rest, passwordEnc, updatedAt: new Date() } },
    { upsert: true },
  )
}
