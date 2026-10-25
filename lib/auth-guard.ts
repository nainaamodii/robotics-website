import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { env } from './env'
import { AuthError, ForbiddenError } from './errors'
import { getUserById } from './models/user'
import { assertAllowedEmail } from './email-policy'

interface UserTokenPayload {
  userId: string
  email?: string
  iat?: number
  exp?: number
}

interface AdminTokenPayload {
  admin: boolean
  iat?: number
  exp?: number
}

// Pin the algorithm so a token can never be accepted under a different `alg`
// (e.g. "none" or an RS/HS confusion) than the one we sign with.
const VERIFY_OPTIONS: jwt.VerifyOptions = { algorithms: ['HS256'] }

/** Returns the authenticated userId, or null if the request is unauthenticated. Never throws. */
export async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, VERIFY_OPTIONS) as UserTokenPayload
    return typeof decoded.userId === 'string' ? decoded.userId : null
  } catch {
    return null
  }
}

/** Returns true if the request has a valid admin_token cookie. Never throws. */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, VERIFY_OPTIONS) as AdminTokenPayload
    return decoded.admin === true
  } catch {
    return false
  }
}

/**
 * Resolve both identities at once. Students authenticate with `auth_token`
 * (email OTP sign-in) and admins with `admin_token` (admin password) — two
 * independent cookies. Endpoints that serve either audience (e.g. team detail)
 * use this instead of `requireUser()`, which would wrongly 401 a pure admin.
 */
export async function getSession(): Promise<{ userId: string | null; isAdmin: boolean }> {
  const [userId, admin] = await Promise.all([getAuthUserId(), isAdmin()])
  return { userId, isAdmin: admin }
}

/** Guarantee an authenticated user or throw AuthError (401). */
export async function requireUser(): Promise<string> {
  const userId = await getAuthUserId()
  if (!userId) throw new AuthError()
  return userId
}

/** Guarantee an admin session or throw ForbiddenError (403). */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new ForbiddenError('Admin access required')
}

/**
 * Guarantee the caller is either the target user OR an admin.
 * Used for endpoints like "edit user by id" — a user can edit themselves,
 * an admin can edit anyone, no one else can touch the record.
 */
export async function requireSelfOrAdmin(
  targetUserId: string,
): Promise<{ userId: string | null; isAdmin: boolean }> {
  const userId = await getAuthUserId()
  const admin = await isAdmin()
  if (!userId && !admin) throw new AuthError()
  if (!admin && userId !== targetUserId) throw new ForbiddenError()
  return { userId, isAdmin: admin }
}

/**
 * Authenticated AND email-verified. Every OTP sign-in verifies the address, so
 * this only rejects sessions that predate OTP auth (e.g. old Google logins)
 * until the user signs in again with a code.
 */
export async function requireVerifiedUser(): Promise<string> {
  const userId = await requireUser()
  const user = await getUserById(userId)
  if (!user) throw new AuthError('Account not found')
  assertAllowedEmail(user.email)
  if (!user.emailVerified) {
    throw new ForbiddenError('Verify your email to continue. Sign out and sign in with a code.')
  }
  return userId
}
