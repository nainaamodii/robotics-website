/**
 * AES-256-GCM encryption for secrets stored in MongoDB (e.g. the SMTP password
 * the admin enters in the dashboard). The key is derived from JWT_SECRET, so a
 * database dump alone does not expose the credential.
 *
 * Format: base64(iv[12] | authTag[16] | ciphertext)
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { env } from './env'

function key(): Buffer {
  return createHash('sha256').update(`secret-box:${env.JWT_SECRET}`).digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64')
}

/** Returns null if the blob is malformed or was encrypted under a different key. */
export function decryptSecret(blob: string): string | null {
  try {
    const raw = Buffer.from(blob, 'base64')
    const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
