import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env'
import { OtpVerifySchema } from '@/lib/validation'
import { AuthError, handleApiError } from '@/lib/errors'
import { verifyOtp } from '@/lib/otp'
import { findOrCreateVerifiedUser } from '@/lib/models/user'
import { clientIp, enforceLimit, otpVerifyLimiter } from '@/lib/rate-limit'
import { cacheDel, cacheKeys } from '@/lib/redis'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/otp/verify { email, code }
 * On success the address is proven, the account is created/marked verified and
 * the same `auth_token` session cookie the rest of the app already uses is set.
 */
export async function POST(request: NextRequest) {
  try {
    await enforceLimit(otpVerifyLimiter(), clientIp(request))
    const { email, code } = OtpVerifySchema.parse(await request.json())
    await verifyOtp(email, code)

    const user = await findOrCreateVerifiedUser(email)
    if (!user?._id) throw new AuthError('Could not establish session')

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, env.JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256',
    })
    const store = await cookies()
    store.set('auth_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    void cacheDel(cacheKeys.user(user._id.toString()))

    return NextResponse.json({
      message: 'Signed in',
      isProfileComplete: user.isProfileComplete ?? false,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
