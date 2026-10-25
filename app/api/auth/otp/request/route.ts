import { NextRequest, NextResponse } from 'next/server'
import { OtpRequestSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { requestOtp } from '@/lib/otp'
import { clientIp, enforceLimit, otpRequestLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/otp/request { email }
 * Emails a 6-digit code. The response is identical whether or not the account
 * exists, so this can't be used to enumerate members.
 */
export async function POST(request: NextRequest) {
  try {
    await enforceLimit(otpRequestLimiter(), clientIp(request))
    const { email } = OtpRequestSchema.parse(await request.json())
    await requestOtp(email)
    return NextResponse.json({ message: 'Verification code sent', resendInSec: 45 })
  } catch (error) {
    return handleApiError(error)
  }
}
