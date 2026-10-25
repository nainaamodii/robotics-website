/**
 * Minimal HS256 JWT verification using the Web Crypto API.
 *
 * Why this exists: `middleware.ts` runs on the Edge runtime, where the
 * `jsonwebtoken` package (Node `crypto`) is unavailable. Previously the
 * middleware only checked that an auth cookie *existed*, so any garbage value
 * (or a token signed with a rotated secret) passed the page-level gate and, for
 * signed-out users with a stale cookie, trapped them in a redirect loop away
 * from /auth/signin.
 *
 * This verifies the signature (HS256 only — never trusts the header's `alg`),
 * `exp` and `nbf`. It is a UX-level gate: every API route still performs its own
 * authoritative check with `lib/auth-guard.ts`.
 */

function b64urlToBytes(input: string): Uint8Array {
  const pad = '='.repeat((4 - (input.length % 4)) % 4)
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function parseJsonPart(part: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(b64urlToBytes(part)))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Returns the payload if the token is a valid, unexpired HS256 JWT; otherwise null. */
export async function verifyHs256Jwt(
  token: string | undefined | null,
  secret: string | undefined | null,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<Record<string, unknown> | null> {
  if (!token || !secret) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, p, s] = parts

  const header = parseJsonPart(h)
  if (!header || header.alg !== 'HS256') return null

  let signature: Uint8Array
  try {
    signature = b64urlToBytes(s)
  } catch {
    return null
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    signature as BufferSource,
    new TextEncoder().encode(`${h}.${p}`) as BufferSource,
  )
  if (!ok) return null

  const payload = parseJsonPart(p)
  if (!payload) return null
  if (typeof payload.exp === 'number' && payload.exp <= nowSec) return null
  if (typeof payload.nbf === 'number' && payload.nbf > nowSec) return null
  return payload
}
