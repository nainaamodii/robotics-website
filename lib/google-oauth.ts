/**
 * Google OAuth 2.0 helpers.
 *
 * Approach: classic server-side auth code flow — we're a confidential client
 * (server holds the client secret), so no PKCE needed.
 *
 *   1. buildAuthUrl(state) → URL to redirect user to Google
 *   2. Google redirects back with ?code=...&state=...
 *   3. exchangeCodeForProfile(code) → decoded user profile
 *
 * We fetch userinfo via Google's REST endpoint (not the id_token) because it
 * avoids needing a JWT verifier at the edge. Google authenticates our access
 * token, we trust their response.
 *
 * If GOOGLE_CLIENT_ID/SECRET aren't set, `isGoogleOAuthConfigured` returns
 * false and callers should return 501.
 */
import { env } from './env'
import { AuthError, ApiError } from './errors'
import { log } from './logger'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

const SCOPES = ['openid', 'email', 'profile'].join(' ')

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

/** Always resolves to a valid absolute URL, using APP_URL as the base. */
function redirectUri(): string {
  return `${env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
}

/**
 * Build the URL to send the user to Google for consent.
 * `state` is a random string we generated + stored in a cookie — Google echoes
 * it back so we can prove the callback originated from our flow (CSRF guard).
 */
export function buildAuthUrl(state: string): string {
  if (!isGoogleOAuthConfigured()) {
    throw new ApiError(501, 'Google Sign-In is not configured on this server')
  }
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID!)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'online') // no refresh token — we only need a one-shot signin
  url.searchParams.set('prompt', 'select_account')
  // UI hint only (Google shows just this domain's accounts). The real check is server-side.
  if (env.ALLOWED_EMAIL_DOMAIN) url.searchParams.set('hd', env.ALLOWED_EMAIL_DOMAIN)
  url.searchParams.set('state', state)
  return url.toString()
}

interface GoogleProfile {
  sub: string // Google's stable subject id — this is what we store as googleId
  email: string
  email_verified: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}

/**
 * Complete the OAuth handshake: swap the auth code for tokens, then fetch the
 * user's Google profile. Returns the profile ready to store.
 */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  if (!isGoogleOAuthConfigured()) {
    throw new ApiError(501, 'Google Sign-In is not configured on this server')
  }

  // 1. Exchange auth code for an access token.
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '')
    log.warn('google token exchange failed', { status: tokenRes.status, body: body.slice(0, 200) })
    throw new AuthError('google_token_exchange_failed')
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string }
  if (!tokenData.access_token) {
    throw new AuthError('google_no_access_token')
  }

  // 2. Fetch the user profile with the access token.
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  if (!userRes.ok) {
    throw new AuthError('google_profile_failed')
  }
  const profile = (await userRes.json()) as GoogleProfile
  if (!profile.email) {
    throw new AuthError('google_no_email')
  }
  if (profile.email_verified !== true) {
    throw new AuthError('google_email_unverified')
  }
  return { ...profile, email: profile.email.trim().toLowerCase() }
}
