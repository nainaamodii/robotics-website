import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/models/user'
import { requireUser } from '@/lib/auth-guard'
import { NotFoundError, handleApiError } from '@/lib/errors'
import { cacheKeys, withCache } from '@/lib/redis'

// Cache the user document for 60 seconds. Signed-in pages hit /me on every
// route change, so this shaves off a Mongo round-trip most of the time.
// Invalidated by PUT /api/users/[id] when the profile changes.
const ME_CACHE_TTL_SEC = 60

export async function GET() {
  try {
    const userId = await requireUser()

    const user = await withCache(cacheKeys.user(userId), ME_CACHE_TTL_SEC, () =>
      getUserById(userId),
    )
    if (!user) throw new NotFoundError('User not found')

    // Whitelist fields returned to the client — never send `password` or other
    // internal fields even if they exist on the doc.
    return NextResponse.json({
      _id: user._id,
      email: user.email,
      emailVerified: user.emailVerified ?? false,
      name: user.name,
      rollNo: user.rollNo,
      department: user.department,
      phone: user.phone,
      college: user.college,
      isMnnit: user.isMnnit,
      isProfileComplete: user.isProfileComplete ?? false,
      profileImage: user.profileImage,
      bio: user.bio,
      teamId: user.teamId,
      codename: user.codename,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
