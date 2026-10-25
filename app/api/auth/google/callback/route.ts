import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env'
import { exchangeCodeForProfile } from '@/lib/google-oauth'
import { isAllowedEmail } from '@/lib/email-policy'
import { findOrCreateVerifiedUser, updateUser } from '@/lib/models/user'
import { ApiError, AuthError } from '@/lib/errors'
import { log } from '@/lib/logger'
import { cacheDel, cacheKeys } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/** Error codes the sign-in page knows how to render — nothing free-form is reflected back. */
const KNOWN_ERRORS = new Set([
  'invalid_state',
  'missing_code_or_state',
  'google_access_denied',
  'google_not_configured',
  'google_token_exchange_failed',
  'google_no_access_token',
  'google_profile_failed',
  'google_no_email',
  'google_email_unverified',
  'wrong_domain',
  'oauth_failed',
])

/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * 1. Check `state` against the cookie set at /api/auth/google (CSRF guard).
 * 2. Exchange the code for the Google profile (email must be Google-verified).
 * 3. Enforce the allowed email domain.
 * 4. Find-or-create the user by email — the same account an email-OTP sign-in
 *    would use — and mark it verified (Google verified the address).
 * 5. Issue the same `auth_token` cookie as the OTP flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  try {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errParam = searchParams.get('error')

    if (errParam) return redirectToSignin(request, errParam === 'access_denied' ? 'google_access_denied' : 'oauth_failed')
    if (!code || !state) return redirectToSignin(request, 'missing_code_or_state')

    const store = await cookies()
    const stateCookie = store.get('oauth_state')?.value
    const nextCookie = store.get('oauth_next')?.value ?? '/'
    if (!stateCookie || stateCookie !== state) return redirectToSignin(request, 'invalid_state')
    store.delete('oauth_state')
    store.delete('oauth_next')

    const profile = await exchangeCodeForProfile(code)
    if (!isAllowedEmail(profile.email)) return redirectToSignin(request, 'wrong_domain')

    const user = await findOrCreateVerifiedUser(profile.email)
    if (!user?._id) throw new AuthError('oauth_failed')

    // Fill in cosmetic fields only if the user hasn't set their own yet.
    if (!user.isProfileComplete && profile.name && user.name === profile.email.split('@')[0]) {
      await updateUser(user._id, { name: profile.name, ...(profile.picture && !user.profileImage ? { profileImage: profile.picture } : {}) })
    }

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, env.JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256',
    })
    store.set('auth_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    void cacheDel(cacheKeys.user(user._id.toString()))

    // Same-origin relative paths only. Backslashes/tabs are treated as "/" by browsers.
    const safeNext =
      nextCookie.startsWith('/') && !nextCookie.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(nextCookie)
        ? nextCookie
        : '/'
    const dest = user.isProfileComplete
      ? safeNext
      : `/onboarding/complete-profile?next=${encodeURIComponent(safeNext)}`
    return NextResponse.redirect(new URL(dest, request.url))
  } catch (error) {
    log.warn('google oauth callback failed', { err: error instanceof Error ? error.message : String(error) })
    const msg = error instanceof Error ? error.message : ''
    const code = error instanceof ApiError && error.statusCode === 501 ? 'google_not_configured' : msg
    return redirectToSignin(request, KNOWN_ERRORS.has(code) ? code : 'oauth_failed')
  }
}

function redirectToSignin(request: NextRequest, error: string): NextResponse {
  const url = new URL('/auth/signin', request.url)
  url.searchParams.set('error', KNOWN_ERRORS.has(error) ? error : 'oauth_failed')
  return NextResponse.redirect(url)
}
