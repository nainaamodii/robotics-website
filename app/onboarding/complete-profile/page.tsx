"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Check, Loader2, UserCircle, X } from "lucide-react"
import { motion } from "framer-motion"
import Starfield from "@/components/realm/starfield"
import { useAuth } from "@/lib/auth-context"

const BRANCHES = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Production & Industrial Engineering",
  "Biotechnology",
  "Information Technology",
  "Mathematics & Scientific Computing",
  "GIS & Remote Sensing",
]

const CODENAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/

function CompleteProfileInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const nextParam = searchParams.get("next") ?? "/"
  const safeNext = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/"

  useEffect(() => {
    if (user?.isProfileComplete) {
      router.replace(safeNext)
    }
  }, [user, safeNext, router])

  const isMnnitEmail = useMemo(() => user?.email?.endsWith("@mnnit.ac.in") ?? false, [user])

  const [isMnnit, setIsMnnit] = useState(isMnnitEmail)
  const [fullName, setFullName] = useState("")
  const [rollNo, setRollNo] = useState("")
  const [phone, setPhone] = useState("")
  const [branch, setBranch] = useState("")
  const [college, setCollege] = useState(isMnnitEmail ? "MNNIT Allahabad" : "")
  const [codename, setCodename] = useState("")
  const [codenameChecking, setCodenameChecking] = useState(false)
  const [codenameAvailable, setCodenameAvailable] = useState<null | boolean>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMnnit(isMnnitEmail)
    if (isMnnitEmail) setCollege("MNNIT Allahabad")
  }, [isMnnitEmail])

  const codenameValid = useMemo(() => {
    if (!codename) return { ok: true, reason: "" }
    if (codename.length < 3) return { ok: false, reason: "Min 3 characters" }
    if (codename.length > 20) return { ok: false, reason: "Max 20 characters" }
    if (!CODENAME_REGEX.test(codename)) return { ok: false, reason: "Letters, digits, underscore. Must start with a letter." }
    return { ok: true, reason: "" }
  }, [codename])

  useEffect(() => {
    if (!codename || !codenameValid.ok) { setCodenameAvailable(null); return }
    let cancelled = false
    const t = setTimeout(async () => {
      setCodenameChecking(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(codename.toLowerCase())}`, { credentials: "include" })
        if (!res.ok || cancelled) return
        const list = await res.json()
        if (cancelled) return
        const exact = list.find((u: any) => u.codename === codename.toLowerCase())
        setCodenameAvailable(!exact)
      } finally {
        if (!cancelled) setCodenameChecking(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [codename, codenameValid.ok])

  const canSubmit = useMemo(() => {
    if (fullName.trim().length < 2) return false
    if (!/^[6-9]\d{9}$/.test(phone)) return false
    if (!branch) return false
    if (isMnnit && !rollNo.trim()) return false
    if (!isMnnit && !college.trim()) return false
    if (codename && (!codenameValid.ok || codenameAvailable === false)) return false
    return true
  }, [fullName, phone, branch, isMnnit, rollNo, college, codename, codenameValid.ok, codenameAvailable])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !user?._id) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/onboarding/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          branch: branch.trim(),
          isMnnit,
          rollNo: isMnnit ? rollNo.trim() : undefined,
          college: isMnnit ? "MNNIT Allahabad" : college.trim(),
          codename: codename.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error ?? "Failed to complete profile")
        return
      }
      await refreshUser()
      router.replace(safeNext)
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="dark realm min-h-screen relative flex items-center justify-center px-6 py-12">
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-7 h-7 text-[var(--fg-tertiary)]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--fg)]">Complete Your Profile</h1>
            <p className="text-sm text-[var(--fg-tertiary)] mt-1">
              Welcome, {user.name}! Just a few details to get started.
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* MNNIT checkbox */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => { if (!isMnnitEmail) setIsMnnit(!isMnnit) }}
                disabled={isMnnitEmail}
                aria-label="MNNIT student"
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isMnnit
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-[var(--border-hover)] bg-transparent"
                }`}
              >
                {isMnnit && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">I am an MNNIT student</p>
                {isMnnitEmail && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Auto-detected from your @mnnit.ac.in email</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="As it should appear on your team roster"
                maxLength={100}
                className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
              />
            </div>

            {/* Registration number — MNNIT only */}
            {isMnnit && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">Registration Number *</label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value)}
                  placeholder="e.g. 20215001"
                  maxLength={20}
                  className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
                />
              </motion.div>
            )}

            {/* College — non-MNNIT only */}
            {!isMnnit && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">College / University *</label>
                <input
                  type="text"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="e.g. IIT Delhi"
                  maxLength={200}
                  className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
                />
              </motion.div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="9876543210"
                maxLength={10}
                aria-invalid={phone.length > 0 && !/^[6-9]\d{9}$/.test(phone)}
                className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
              />
              {phone.length > 0 && !/^[6-9]\d{9}$/.test(phone) && (
                <p className="mt-1.5 text-xs text-red-500">
                  {/^[6-9]/.test(phone) ? `${phone.length}/10 digits` : "Must start with 6, 7, 8 or 9"}
                </p>
              )}
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">Branch *</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm appearance-none"
              >
                <option value="" disabled>Select your branch</option>
                {BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Codename (optional) */}
            <div>
              <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">
                Codename <span className="text-[var(--fg-tertiary)] normal-case">(optional — used for team invites)</span>
              </label>
              <input
                type="text"
                value={codename}
                onChange={e => setCodename(e.target.value)}
                placeholder="e.g. nexus_pilot"
                maxLength={20}
                autoComplete="off"
                className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
              />
              {codename && (
                <div className={`mt-2 text-xs flex items-center gap-1.5 ${
                  !codenameValid.ok ? "text-[var(--fg-tertiary)]"
                  : codenameChecking ? "text-[var(--fg-tertiary)]"
                  : codenameAvailable === true ? "text-emerald-500"
                  : codenameAvailable === false ? "text-red-500"
                  : "text-[var(--fg-tertiary)]"
                }`}>
                  {!codenameValid.ok ? <><X className="w-3.5 h-3.5" /> {codenameValid.reason}</>
                  : codenameChecking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</>
                  : codenameAvailable === true ? <><Check className="w-3.5 h-3.5" /> Available</>
                  : codenameAvailable === false ? <><X className="w-3.5 h-3.5" /> Taken</>
                  : null}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full py-3.5 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfileInner />
    </Suspense>
  )
}
