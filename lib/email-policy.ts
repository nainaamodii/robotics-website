/**
 * Who may sign in. Applies to every auth path (email OTP and Google) and is
 * re-checked when registering, so stale sessions of other-domain users stop working.
 */
import { env } from './env'
import { ApiError } from './errors'

export const ALLOWED_EMAIL_DOMAIN = env.ALLOWED_EMAIL_DOMAIN

/** Exact-domain match on the part after the last "@" — "x@evilmnnit.ac.in" and "x@mnnit.ac.in.evil.com" fail. */
export function isAllowedEmail(email: string): boolean {
  if (!ALLOWED_EMAIL_DOMAIN) return true
  const at = email.lastIndexOf('@')
  return at > 0 && email.slice(at + 1).toLowerCase() === ALLOWED_EMAIL_DOMAIN
}

export function assertAllowedEmail(email: string): void {
  if (!isAllowedEmail(email)) {
    throw new ApiError(403, `Only @${ALLOWED_EMAIL_DOMAIN} email addresses can sign in.`)
  }
}
