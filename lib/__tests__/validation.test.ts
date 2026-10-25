/**
 * Sanity tests for the Zod schemas. Pure functions — no DB, no HTTP, fast.
 *
 * These aren't exhaustive; they're a starting scaffold. When you add a new
 * schema or refine a rule, add a case here to prevent regressions.
 *
 * Run: npm test
 */
import { describe, expect, it } from 'vitest'
import {
  CreateCompetitionSchema,
  CreateProjectSchema,
  ObjectIdSchema,
  ParticipateSchema,
  MobileNumberSchema,
  OtpRequestSchema,
  OtpVerifySchema,
  SendInvitationSchema,
  UpdateUserSchema,
} from '../validation'

describe('ObjectIdSchema', () => {
  it('accepts a 24-hex-char id', () => {
    expect(ObjectIdSchema.safeParse('6a532167a0a0dfd397aaf65e').success).toBe(
      true,
    )
  })
  it('rejects short strings', () => {
    expect(ObjectIdSchema.safeParse('abc').success).toBe(false)
  })
  it('rejects non-hex characters', () => {
    expect(
      ObjectIdSchema.safeParse('zzzzz167a0a0dfd397aaf65e').success,
    ).toBe(false)
  })
})

describe('OTP schemas', () => {
  it('lowercases + trims email', () => {
    const r = OtpRequestSchema.safeParse({ email: '  User@Example.COM  ' })
    expect(r.success && r.data.email).toBe('user@example.com')
  })
  it('rejects malformed email', () => {
    expect(OtpRequestSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
  it('accepts a 6-digit code', () => {
    expect(OtpVerifySchema.safeParse({ email: 'a@b.co', code: ' 042913 ' }).success).toBe(true)
  })
  it.each(['12345', '1234567', 'abcdef', '12 456'])('rejects bad code %s', (code) => {
    expect(OtpVerifySchema.safeParse({ email: 'a@b.co', code }).success).toBe(false)
  })
})

describe('UpdateUserSchema (.strict())', () => {
  it('rejects unknown fields — no privilege escalation via body.role', () => {
    const r = UpdateUserSchema.safeParse({
      name: 'New name',
      role: 'admin', // extra field
    })
    expect(r.success).toBe(false)
  })
  it('accepts a partial update', () => {
    const r = UpdateUserSchema.safeParse({ name: 'New name' })
    expect(r.success).toBe(true)
  })
})

describe('CreateProjectSchema', () => {
  it('fills defaults for optional fields', () => {
    const r = CreateProjectSchema.safeParse({
      title: 'T',
      description: 'D',
      shortDescription: 'S',
      category: 'C',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.featured).toBe(false)
      expect(r.data.published).toBe(false)
      expect(r.data.techStack).toEqual([])
    }
  })
})

describe('CreateCompetitionSchema', () => {
  it('rejects when maxTeamSize < minTeamSize', () => {
    const r = CreateCompetitionSchema.safeParse({
      eventId: '6a532167a0a0dfd397aaf65e',
      title: 'C',
      minTeamSize: 5,
      maxTeamSize: 3,
    })
    expect(r.success).toBe(false)
  })
  it('accepts equal min and max', () => {
    const r = CreateCompetitionSchema.safeParse({
      eventId: '6a532167a0a0dfd397aaf65e',
      title: 'C',
      minTeamSize: 3,
      maxTeamSize: 3,
    })
    expect(r.success).toBe(true)
  })
})

describe('ParticipateSchema (discriminated union)', () => {
  it('accepts a CREATE payload', () => {
    const r = ParticipateSchema.safeParse({
      action: 'CREATE',
      competitionId: '6a532167a0a0dfd397aaf65e',
      teamName: 'T',
    })
    expect(r.success).toBe(true)
  })
  it('uppercases teamCode on JOIN', () => {
    const r = ParticipateSchema.safeParse({
      action: 'JOIN',
      teamCode: 'abc123',
    })
    expect(r.success && (r.data as any).teamCode).toBe('ABC123')
  })
})

describe('SendInvitationSchema (union: id OR email)', () => {
  it('accepts a userId', () => {
    expect(
      SendInvitationSchema.safeParse({
        invitedUser: '6a532167a0a0dfd397aaf65e',
      }).success,
    ).toBe(true)
  })
  it('accepts an email', () => {
    expect(
      SendInvitationSchema.safeParse({ email: 'a@b.com' }).success,
    ).toBe(true)
  })
  it('rejects a bad email', () => {
    expect(
      SendInvitationSchema.safeParse({ email: 'not-an-email' }).success,
    ).toBe(false)
  })
})

describe('MobileNumberSchema', () => {
  it.each(['6000000000', '7123456789', '8999999999', '9876543210'])('accepts %s', (n) => {
    expect(MobileNumberSchema.safeParse(n).success).toBe(true)
  })
  it.each([
    ['starts with 5', '5876543210'],
    ['starts with 0', '0876543210'],
    ['9 digits', '987654321'],
    ['11 digits', '98765432101'],
    ['has +91', '+919876543210'],
    ['has spaces', '98765 43210'],
    ['letters', '98765abcde'],
    ['empty', ''],
  ])('rejects %s', (_label, n) => {
    expect(MobileNumberSchema.safeParse(n).success).toBe(false)
  })
})
