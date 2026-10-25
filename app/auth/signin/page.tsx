"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react"
import RealmPage, { Eyebrow } from "@/components/realm/realm-page"
import { useAuth } from "@/lib/auth-context"

const CODE_LENGTH = 6

const GOOGLE_ERRORS: Record<string, string> = {
  invalid_state: "Google sign-in session expired. Please try again.",
  missing_code_or_state: "Google sign-in was cancelled or incomplete. Please try again.",
  google_access_denied: "You cancelled Google sign-in.",
  google_not_configured: "Google sign-in isn't set up on this server. Use an email code instead.",
  google_email_unverified: "Your Google email isn't verified.",
  wrong_domain: "Only your college email can be used to sign in.",
  oauth_failed: "Google sign-in failed. Please try again.",
}
const RESEND_SECONDS = 45

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/"
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return "/"
  return next
}

function SignInInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const next = safeNextPath(searchParams.get("next"))

  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [providers, setProviders] = useState<{ google: boolean; emailDomain: string | null }>({ google: false, emailDomain: null })
  const boxes = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {})
    const err = searchParams.get("error")
    if (err) setError(GOOGLE_ERRORS[err] ?? "Sign-in failed. Please try again.")
  }, [searchParams])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function post(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        data?.details?.fieldErrors?.email?.[0] ??
        data?.details?.fieldErrors?.code?.[0] ??
        data?.error ??
        "Something went wrong"
      const retry = Number(res.headers.get("Retry-After"))
      if (res.status === 429 && retry > 0) setCooldown(retry)
      throw Object.assign(new Error(msg), { status: res.status })
    }
    return data
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    try {
      await post("/api/auth/otp/request", { email })
      setStep("code")
      setDigits(Array(CODE_LENGTH).fill(""))
      setCooldown(RESEND_SECONDS)
    } catch (err: any) {
      if (err.status === 429 && step === "email") {
        // A code was already sent moments ago — let them enter it rather than wait.
        setStep("code")
        setDigits(Array(CODE_LENGTH).fill(""))
        setError("A code was sent recently. Enter it below, or resend when the timer ends.")
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  async function verify(code: string) {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const data = await post("/api/auth/otp/verify", { email, code })
      await refreshUser()
      router.replace(
        data.isProfileComplete ? next : `/onboarding/complete-profile?next=${encodeURIComponent(next)}`,
      )
    } catch (err: any) {
      setError(err.message)
      setDigits(Array(CODE_LENGTH).fill(""))
      boxes.current[0]?.focus()
      setBusy(false)
    }
  }

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "")
    if (!clean) {
      setDigits((d) => d.map((x, j) => (j === i ? "" : x)))
      return
    }
    // Pasting or autofilling a full code lands in one box — spread it out.
    const chars = clean.slice(0, CODE_LENGTH - i).split("")
    const nextDigits = [...digits]
    chars.forEach((c, k) => (nextDigits[i + k] = c))
    setDigits(nextDigits)
    const focusAt = Math.min(i + chars.length, CODE_LENGTH - 1)
    boxes.current[focusAt]?.focus()
    if (nextDigits.every(Boolean)) verify(nextDigits.join(""))
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) boxes.current[i + 1]?.focus()
  }

  return (
    <RealmPage footer={false}>
      <section className="min-h-[calc(100vh-80px)] flex items-center px-6 py-16">
        <div className="max-w-[1200px] mx-auto w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Eyebrow index="00">Secure channel · MNNIT Robotics</Eyebrow>
            <h1 className="realm-title mt-6 text-[clamp(3.5rem,11vw,9rem)]">
              Verify<br />Identity
            </h1>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[var(--fg-secondary)]">
              No passwords. Sign in with Google or get a one-time code by email.
              {providers.emailDomain && <> Only <span className="text-white">@{providers.emailDomain}</span> addresses are accepted.</>} Every
              crew member is verified before they can register for an event.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="realm-panel p-8 md:p-10"
          >
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.form
                  key="email"
                  onSubmit={sendCode}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  noValidate
                >
                  <p className="realm-eyebrow mb-6">{providers.google ? "Sign in" : "Step 1 / 2 — Email"}</p>
                  {providers.google && (
                    <>
                      <a
                        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
                        className="realm-btn realm-btn-ghost w-full mb-6"
                      >
                        <GoogleMark /> Continue with Google
                      </a>
                      <div className="flex items-center gap-4 mb-6" aria-hidden>
                        <span className="h-px flex-1 bg-[var(--border)]" />
                        <span className="realm-eyebrow !text-[10px]">or use email</span>
                        <span className="h-px flex-1 bg-[var(--border)]" />
                      </div>
                    </>
                  )}
                  <label htmlFor="email" className="block text-xs uppercase tracking-[0.18em] text-[var(--fg-tertiary)] mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError("") }}
                    placeholder={providers.emailDomain ? `you@${providers.emailDomain}` : "you@example.com"}
                    aria-describedby={error ? "auth-error" : undefined}
                    className="w-full bg-transparent border border-[var(--border)] focus:border-white px-4 py-3.5 text-base text-white placeholder:text-[var(--fg-tertiary)] outline-none transition-colors"
                  />
                  <button type="submit" disabled={busy || !email.includes("@")} className="realm-btn mt-6 w-full">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send code <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                >
                  <p className="realm-eyebrow mb-6">Step 2 / 2 — Code</p>
                  <div className="flex items-start gap-3 mb-6">
                    <MailCheck className="w-5 h-5 mt-0.5 text-[var(--accent)] shrink-0" />
                    <p className="text-sm text-[var(--fg-secondary)]">
                      Code sent to <span className="text-white break-all">{email}</span>
                    </p>
                  </div>
                  <div role="group" aria-label="6-digit verification code" className="flex gap-2 sm:gap-3">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { boxes.current[i] = el }}
                        value={d}
                        onChange={(e) => setDigit(i, e.target.value)}
                        onKeyDown={(e) => onKeyDown(i, e)}
                        onFocus={(e) => e.target.select()}
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={CODE_LENGTH}
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        aria-label={`Digit ${i + 1}`}
                        disabled={busy}
                        autoFocus={i === 0}
                        className="w-full min-w-0 aspect-[4/5] max-h-16 text-center text-2xl font-mono bg-transparent border border-[var(--border)] focus:border-white text-white outline-none transition-colors disabled:opacity-50"
                      />
                    ))}
                  </div>
                  {busy && (
                    <p className="mt-4 text-xs text-[var(--fg-tertiary)] flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…
                    </p>
                  )}
                  <div className="mt-8 flex items-center justify-between text-xs uppercase tracking-[0.16em]">
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setError("") }}
                      className="inline-flex items-center gap-2 text-[var(--fg-secondary)] hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Change email
                    </button>
                    <button
                      type="button"
                      onClick={() => sendCode()}
                      disabled={cooldown > 0 || busy}
                      className="text-[var(--fg-secondary)] hover:text-white disabled:opacity-40 disabled:hover:text-[var(--fg-secondary)] transition-colors"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div id="auth-error" role="alert" className="mt-6 flex items-start gap-2 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <p className="mt-8 pt-6 border-t border-[var(--border)] text-xs text-[var(--fg-tertiary)]">
              Site admin?{" "}
              <Link href="/admin/auth" className="text-[var(--fg-secondary)] hover:text-white underline underline-offset-4">
                Admin console
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </RealmPage>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.57v2.97h3.85c2.25-2.08 3.58-5.14 3.58-8.78z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.85-2.97c-1.07.72-2.44 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.26 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.97-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.97 3.09C6.21 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}
