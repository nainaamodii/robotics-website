/**
 * Transactional email over SMTP.
 *
 * Credentials come from the admin dashboard (Admin → Email / SMTP), stored
 * encrypted in MongoDB — nothing SMTP-related lives in env vars or source.
 *
 * With no SMTP configured: in development the message is logged to the server
 * console so the OTP flow stays testable; in production sending fails loudly
 * (503) rather than silently dropping verification codes.
 */
import nodemailer, { type Transporter } from 'nodemailer'
import { ApiError } from './errors'
import { log } from './logger'
import { getSmtpSettings, type SmtpSettings } from './models/settings'

interface SendEmailArgs {
  to: string
  subject: string
  text: string
  html?: string
}

let cached: { sig: string; transport: Transporter } | null = null

export function buildTransport(s: SmtpSettings): Transporter {
  const sig = JSON.stringify([s.host, s.port, s.secure, s.user, s.password])
  if (cached?.sig === sig) return cached.transport
  const transport = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure, // true = implicit TLS (465); false = STARTTLS upgrade (587)
    auth: { user: s.user, pass: s.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  cached = { sig, transport }
  return transport
}

export function fromAddress(s: SmtpSettings): string {
  return s.fromName ? `"${s.fromName.replace(/"/g, '')}" <${s.fromEmail}>` : s.fromEmail
}

/** Returns true if actually delivered via SMTP, false if only logged (dev). */
export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  const smtp = await getSmtpSettings()
  if (!smtp) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(503, 'Email delivery is not configured. An admin must set up SMTP in the dashboard.')
    }
    log.info('email (dev console fallback — SMTP not configured in admin dashboard)', {
      to: args.to,
      subject: args.subject,
      text: args.text,
    })
    return false
  }
  try {
    await buildTransport(smtp).sendMail({
      from: fromAddress(smtp),
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    })
    return true
  } catch (err) {
    log.error('smtp send failed', err)
    throw new ApiError(502, 'Could not send the email. Please try again shortly.')
  }
}
