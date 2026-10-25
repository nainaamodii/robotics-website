import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guard'
import { handleApiError, ApiError } from '@/lib/errors'
import { getSmtpSettings } from '@/lib/models/settings'
import { buildTransport, fromAddress } from '@/lib/email'

export const dynamic = 'force-dynamic'

const Body = z.object({ to: z.string().trim().email().max(200) })

/** POST /api/admin/smtp/test { to } — verifies the connection, then sends a test message. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { to } = Body.parse(await request.json())
    const smtp = await getSmtpSettings()
    if (!smtp) throw new ApiError(400, 'Save SMTP settings first')
    const transport = buildTransport(smtp)
    try {
      await transport.verify()
      await transport.sendMail({
        from: fromAddress(smtp),
        to,
        subject: 'MNNIT Robotics — SMTP test',
        text: 'SMTP is configured correctly. Verification codes will be delivered from this address.',
      })
    } catch (e: any) {
      // Admin-only endpoint, so the provider's message is safe and genuinely useful here.
      throw new ApiError(502, `SMTP error: ${String(e?.message ?? e).slice(0, 300)}`)
    }
    return NextResponse.json({ message: `Test email sent to ${to}` })
  } catch (error) {
    return handleApiError(error)
  }
}
