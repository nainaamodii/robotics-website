/**
 * Rate-limiting layer built on Upstash Ratelimit.
 *
 * Design:
 *   - Every limiter is created lazily (first-use) and cached — no upfront work
 *     if a limiter is never hit.
 *   - Reuses the Upstash Redis client that lib/redis.ts already caches via
 *     globalThis, so we don't open a second connection.
 *   - If Upstash isn't configured (dev without Redis creds), limiters return
 *     null and `enforceLimit` is a no-op → the app works, no false 429s.
 *   - Client IP is derived from headers Next.js exposes (`x-forwarded-for`,
 *     `x-real-ip`). Behind Vercel/Cloudflare this is trustworthy; behind a
 *     misconfigured proxy it may be spoofable. Fine for MVP.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'
import { env } from './env'
import { RateLimitError } from './errors'
import { log } from './logger'

declare global {
  // eslint-disable-next-line no-var
  var __upstashRedis: Redis | undefined
}

/** Returns the shared Redis client (same instance used by lib/redis.ts). */
function getSharedRedis(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!globalThis.__upstashRedis) {
    globalThis.__upstashRedis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return globalThis.__upstashRedis
}

type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`

interface LimiterSpec {
  /** How many requests are allowed in the window. */
  requests: number
  /** Sliding-window duration, e.g. '1 h', '5 m'. */
  window: Window
  /** Redis key prefix — namespaces this limiter's keys. */
  prefix: string
}

const cache = new Map<string, Ratelimit>()

/**
 * Lazily create + cache a limiter. Returns null if Redis isn't configured.
 * Each spec.prefix should be unique — using the same prefix twice means two
 * codepaths share the same bucket.
 */
export function limiter(spec: LimiterSpec): Ratelimit | null {
  const cached = cache.get(spec.prefix)
  if (cached) return cached
  const r = getSharedRedis()
  if (!r) return null
  const rl = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(spec.requests, spec.window),
    analytics: false,
    prefix: spec.prefix,
  })
  cache.set(spec.prefix, rl)
  return rl
}

/**
 * Extract a client IP from the request headers. Vercel/Cloudflare/most modern
 * hosts set these — behind a misconfigured proxy this can lie. If we can't
 * determine one we return a constant so we still limit *something* (better
 * than opening the floodgates).
 */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Enforce a limiter. Throws RateLimitError (→ 429 + Retry-After) on limit hit.
 * If Redis isn't configured (limiter is null), this is a no-op.
 */
export async function enforceLimit(
  lim: Ratelimit | null,
  key: string,
): Promise<void> {
  if (!lim) return
  try {
    const { success, reset } = await lim.limit(key)
    if (success) return
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    throw new RateLimitError(retryAfterSec)
  } catch (err) {
    if (err instanceof RateLimitError) throw err
    // Redis outage or similar — log and fail OPEN (allow). Failing closed
    // would take down auth for all users when the cache is down.
    log.warn('rate limiter failure — failing open', {
      key,
      err: err instanceof Error ? err.message : String(err),
    })
  }
}

// ────────────────────────────────────────────────────────────
// Predefined limiters. Each is a distinct sliding-window bucket.
// Tunable — pick generous limits so real users never notice.
// ────────────────────────────────────────────────────────────

/** Signup: rare per user, but expensive (bcrypt + email lookup). 5/hour/IP. */
export const signupLimiter = () =>
  limiter({ requests: 5, window: '1 h', prefix: 'rl:signup' })

/** Signin: users retry on typos — allow burst, quick window. 10/5min/IP. */
export const signinLimiter = () =>
  limiter({ requests: 10, window: '5 m', prefix: 'rl:signin' })

/**
 * Forgot-password: MOST abusable — every call may send an email. Tight limit
 * both to protect email costs AND to protect target-user's inbox.
 * 3/hour/IP.
 */
export const forgotPasswordLimiter = () =>
  limiter({ requests: 3, window: '1 h', prefix: 'rl:forgot' })

/** Reset-password: tokens are single-use, so this mostly limits guessing. 5/hour/IP. */
export const resetPasswordLimiter = () =>
  limiter({ requests: 5, window: '1 h', prefix: 'rl:reset' })

/** Team-code validation: stops someone enumerating invite codes. 30/min/user. */
export const teamCodeLimiter = () =>
  limiter({ requests: 30, window: '1 m', prefix: 'rl:team-code' })

/** Admin login: brute-force target for the shared password. 5/hour/IP. */
export const adminAuthLimiter = () =>
  limiter({ requests: 5, window: '1 h', prefix: 'rl:admin-auth' })
