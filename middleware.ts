import { NextRequest, NextResponse } from 'next/server'
import { verifyHs256Jwt } from '@/lib/jwt-edge'

const USER_PROTECTED_PATHS = ['/profile', '/dashboard', '/teams', '/participate']

const ADMIN_PROTECTED_PATHS = ['/admin']

const AUTH_PAGES = ['/auth/signin']

function isUnder(path: string, list: string[]): boolean {
  return list.some((p) => path === p || path.startsWith(p + '/'))
}

/**
 * Page-level gate. Tokens are now *verified* (signature + expiry) rather than
 * just checked for presence, so a forged or stale cookie no longer reaches
 * protected pages. This is a UX gate only — every API route re-checks the
 * session server-side via lib/auth-guard.ts, which is the authoritative control.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = process.env.JWT_SECRET

  if (isUnder(pathname, ADMIN_PROTECTED_PATHS)) {
    if (pathname === '/admin/auth' || pathname.startsWith('/admin/auth/')) {
      return NextResponse.next()
    }
    const admin = await verifyHs256Jwt(req.cookies.get('admin_token')?.value, secret)
    if (admin?.admin !== true) {
      return NextResponse.redirect(new URL('/admin/auth', req.url))
    }
    return NextResponse.next()
  }

  if (isUnder(pathname, USER_PROTECTED_PATHS)) {
    const user = await verifyHs256Jwt(req.cookies.get('auth_token')?.value, secret)
    if (typeof user?.userId !== 'string') {
      const url = new URL('/auth/signin', req.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (isUnder(pathname, AUTH_PAGES)) {
    const token = req.cookies.get('auth_token')?.value
    if (token) {
      const user = await verifyHs256Jwt(token, secret)
      // Only bounce away from the sign-in page when the session is genuinely valid;
      // a stale cookie must not lock the user out of signing in again.
      if (typeof user?.userId === 'string') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/|_next/|_static/|.*\\..*).*)'],
}
