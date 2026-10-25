import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth-guard'
import { CompleteProfileSchema } from '@/lib/validation'
import { updateUser, setUserCodename, getUserById } from '@/lib/models/user'
import { assertAllowedEmail } from '@/lib/email-policy'
import { AuthError, handleApiError } from '@/lib/errors'
import { cacheDel, cacheKeys } from '@/lib/redis'

export async function POST(request: Request) {
  try {
    const userId = await requireUser()
    const body = await request.json()
    const data = CompleteProfileSchema.parse(body)

    // MNNIT status comes from the verified email, never from the request body.
    const account = await getUserById(userId)
    if (!account) throw new AuthError('Account not found')
    assertAllowedEmail(account.email)
    const isMnnit = account.email.endsWith('@mnnit.ac.in')
    if (isMnnit && !data.rollNo) {
      return NextResponse.json({ error: 'Registration number is required for MNNIT students' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      name: data.name,
      phone: data.phone,
      department: data.branch,
      isMnnit,
      isProfileComplete: true,
    }

    if (isMnnit) {
      updates.rollNo = data.rollNo
      updates.college = 'MNNIT Allahabad'
    } else {
      updates.college = data.college
    }

    await updateUser(userId, updates)

    if (data.codename) {
      try {
        await setUserCodename(userId, data.codename)
      } catch {
        // codename taken — not a blocker for profile completion
      }
    }

    void cacheDel(cacheKeys.user(userId))

    return NextResponse.json({ message: 'Profile completed' })
  } catch (error) {
    return handleApiError(error)
  }
}
