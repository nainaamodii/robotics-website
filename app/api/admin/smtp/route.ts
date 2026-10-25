import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { handleApiError, ValidationError } from '@/lib/errors'
import { getSmtpPublic, saveSmtpSettings } from '@/lib/models/settings'
import { SmtpSettingsSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/** GET /api/admin/smtp — current config without the password. */
export async function GET() {
  try {
    await requireAdmin()
    const res = NextResponse.json((await getSmtpPublic()) ?? { configured: false })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/admin/smtp — save config. Omit/empty `password` to keep the stored one. */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const input = SmtpSettingsSchema.parse(await request.json())
    try {
      await saveSmtpSettings(input)
    } catch (e: any) {
      throw new ValidationError({ password: [e.message] }, e.message)
    }
    return NextResponse.json({ message: 'SMTP settings saved' })
  } catch (error) {
    return handleApiError(error)
  }
}
