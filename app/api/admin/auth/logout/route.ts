import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { handleApiError } from '@/lib/errors'

/**
 * POST /api/admin/auth/logout — ends the admin session. Idempotent: safe to
 * call when not signed in. Does not touch the student `auth_token` session.
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_token')
    cookieStore.set('admin_token', '', { maxAge: 0, path: '/' })
    return NextResponse.json({ message: 'Admin logged out' })
  } catch (error) {
    return handleApiError(error)
  }
}
