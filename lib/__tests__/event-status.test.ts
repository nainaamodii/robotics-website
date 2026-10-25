import { describe, expect, it } from 'vitest'
import { registrationInfo } from '../event-status'

describe('registrationInfo', () => {
  const event = { startDate: '2026-12-10', endDate: '2026-12-12' }
  const at = (iso: string) => new Date(iso)

  it('uses the window when set', () => {
    const e = { ...event, registrationOpensAt: '2026-11-01T00:00:00.000Z', registrationClosesAt: '2026-11-30T00:00:00.000Z' }
    expect(registrationInfo(e, { registrationOpen: false }, at('2026-10-20T00:00:00Z')).state).toBe('not_yet_open')
    expect(registrationInfo(e, { registrationOpen: false }, at('2026-11-15T00:00:00Z')).state).toBe('open')
    expect(registrationInfo(e, { registrationOpen: true }, at('2026-12-01T00:00:00Z')).state).toBe('ended')
  })
  it('falls back to the competition switch with no window', () => {
    expect(registrationInfo(event, { registrationOpen: true }, at('2026-11-01T00:00:00Z')).state).toBe('open')
    expect(registrationInfo(event, { registrationOpen: false }, at('2026-11-01T00:00:00Z')).state).toBe('closed')
  })
  it('is concluded once the event is over', () => {
    const e = { ...event, registrationOpensAt: '2026-11-01T00:00:00.000Z' }
    expect(registrationInfo(e, { registrationOpen: true }, at('2026-12-13T00:00:00Z')).state).toBe('concluded')
  })
})
