import { NextResponse } from 'next/server'
import { isGoogleOAuthConfigured } from '@/lib/google-oauth'
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/email-policy'

export const dynamic = 'force-dynamic'

/** Which sign-in options this deployment offers. Email OTP is always on. */
export async function GET() {
  return NextResponse.json({
    email: true,
    google: isGoogleOAuthConfigured(),
    emailDomain: ALLOWED_EMAIL_DOMAIN || null,
  })
}
