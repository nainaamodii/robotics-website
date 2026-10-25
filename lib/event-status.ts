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
