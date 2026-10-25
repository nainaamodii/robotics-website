import { describe, expect, it, vi } from 'vitest'

vi.mock('../env', () => ({ env: { ALLOWED_EMAIL_DOMAIN: 'mnnit.ac.in' } }))

import { isAllowedEmail } from '../email-policy'

describe('isAllowedEmail (mnnit.ac.in)', () => {
  it('accepts college addresses, case-insensitively', () => {
    expect(isAllowedEmail('rahul@mnnit.ac.in')).toBe(true)
    expect(isAllowedEmail('Rahul.Sharma@MNNIT.AC.IN')).toBe(true)
  })
  it.each([
    'rahul@gmail.com',
    'rahul@evilmnnit.ac.in',
    'rahul@mnnit.ac.in.evil.com',
    'rahul@sub.mnnit.ac.in',
    'mnnit.ac.in',
    '@mnnit.ac.in',
    '',
  ])('rejects %s', (email) => {
    expect(isAllowedEmail(email)).toBe(false)
  })
})
