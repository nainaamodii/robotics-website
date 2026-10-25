/**
 * Pure helpers for deciding whether an event is still upcoming.
 *
 * Why this exists: events store `startDate` / `endDate` as "YYYY-MM-DD".
 * Parsing that with `new Date("2026-10-26")` yields UTC *midnight at the start*
 * of the last day, so comparing it to "now" marked an event as concluded on
 * its own final day. An event is over at the END of its last day, so we
 * compare against 23:59:59.999 UTC of that day instead.
 *
 * No I/O and no imports — safe to use from route handlers, models and tests.
 */

export interface EventDates {
  startDate?: string
  endDate?: string
}

export type EventStatus = 'upcoming' | 'past'

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/

/** The instant the event is over (end of its last day, UTC), or null if undated. */
export function eventEndsAt(e: EventDates): Date | null {
  const last = e.endDate || e.startDate
  if (!last) return null
  const m = DATE_PREFIX.exec(last)
  if (!m) return null
  const t = Date.parse(`${m[1]}T23:59:59.999Z`)
  return Number.isNaN(t) ? null : new Date(t)
}

/**
 * 'upcoming' while the event has not finished; 'past' afterwards.
 * Events with no usable date are treated as 'past' (same as the previous
 * behaviour of GET /api/events).
 */
export function eventStatus(e: EventDates, now: Date = new Date()): EventStatus {
  const end = eventEndsAt(e)
  return end && end.getTime() >= now.getTime() ? 'upcoming' : 'past'
}

// ────────────────────────────────────────────────────────────
// Registration window
// ────────────────────────────────────────────────────────────

export interface RegistrationWindow {
  /** ISO instants (UTC). Empty / null means "not set". */
  registrationOpensAt?: string | null
  registrationClosesAt?: string | null
}

export type RegistrationState =
  | 'open'          // students can register right now
  | 'not_yet_open'  // a window is set and hasn't started
  | 'ended'         // a window is set and has closed
  | 'closed'        // no window; admin has registration switched off
  | 'concluded'     // the event itself is over

export interface RegistrationInfo {
  state: RegistrationState
  opensAt: string | null
  closesAt: string | null
}

function parseInstant(v?: string | null): Date | null {
  if (!v) return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : new Date(t)
}

/**
 * Single source of truth for "can students register?".
 *
 * When an admin sets an opens/closes time on the EVENT, that window decides.
 * With no window, the older per-competition `registrationOpen` switch applies,
 * so events created before windows existed behave exactly as before.
 * An event that has finished is always 'concluded'.
 */
export function registrationInfo(
  event: (EventDates & RegistrationWindow) | null | undefined,
  competition: { registrationOpen?: boolean } | null | undefined,
  now: Date = new Date(),
): RegistrationInfo {
  const opens = parseInstant(event?.registrationOpensAt)
  const closes = parseInstant(event?.registrationClosesAt)
  const base = {
    opensAt: opens ? opens.toISOString() : null,
    closesAt: closes ? closes.toISOString() : null,
  }
  if (event && eventStatus(event, now) === 'past') return { ...base, state: 'concluded' }
  if (opens || closes) {
    if (opens && now < opens) return { ...base, state: 'not_yet_open' }
    if (closes && now > closes) return { ...base, state: 'ended' }
    return { ...base, state: 'open' }
  }
  return { ...base, state: competition?.registrationOpen ? 'open' : 'closed' }
}
