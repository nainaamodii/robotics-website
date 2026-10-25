import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { buildAuthUrl, isGoogleOAuthConfigured } from '@/lib/google-oauth'
import { env } from '@/lib/env'
import { handleApiError } from '@/lib/errors'

/**
 * GET /api/auth/google[?next=/path]
 *
 * Kicks off the OAuth flow:
 *   1. Generate a random `state` value — used to detect CSRF on callback.
 *   2. Persist it in an httpOnly cookie (short-lived, 10 min).
 *   3. Store the intended post-signin destination alongside it.
 *   4. Redirect the user to Google's consent screen.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.json(
        { error: 'Google Sign-In is not configured on this server' },
        { status: 501 },
      )
    }

    // `next` lets the login form say "after Google auth, send me to /some/page"
    const nextParam = request.nextUrl.searchParams.get('next') ?? '/'
    // Reject open redirects — only same-origin relative paths allowed.
    const safeNext =
      nextParam.startsWith('/') && !nextParam.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(nextParam)
        ? nextParam
        : '/'

    const state = randomBytes(24).toString('hex')

    const store = await cookies()
    store.set('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60, // 10 minutes — plenty for the round trip
    })
    store.set('oauth_next', safeNext, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    })

    return NextResponse.redirect(buildAuthUrl(state))
  } catch (error) {
    return handleApiError(error)
  }
}
