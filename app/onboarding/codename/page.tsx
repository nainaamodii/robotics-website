"use client"

/**
 * Codename setup page.
 *
 * Reached because middleware redirected a signed-in user without a codename
 * here (`?next=<original_path>`). We keep this page dead-simple: one input,
 * live availability check, submit → back to wherever they were headed.
 */

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Check, Loader2, Sparkles, X } from "lucide-react"
import { motion } from "framer-motion"
import Starfield from "@/components/realm/starfield"
import { useAuth } from "@/lib/auth-context"

// Same regex the backend enforces via CodenameSchema.
const CODENAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/

function CodenameSetupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser, updateProfile } = useAuth()
  const nextParam = searchParams.get("next") ?? "/"
  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/"

  // If the user ALREADY has a codename (came here by mistake, or bounced by
  // stale gate state), send them straight to their destination.
  useEffect(() => {
    if (user?.codename) {
      router.replace(safeNext)
    }
  }, [user, safeNext, router])

  const [codename, setCodename] = useState("")
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<null | boolean>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientValid = useMemo(() => {
    if (codename.length < 3) return { ok: false, reason: "Min 3 characters" }
    if (codename.length > 20) return { ok: false, reason: "Max 20 characters" }
    if (!CODENAME_REGEX.test(codename)) {
      return {
        ok: false,
        reason: "Letters, digits, underscore. Must start with a letter.",
      }
    }
    return { ok: true, reason: "" }
  }, [codename])

  // Debounced availability check — reuses /api/users/search which is auth'd.
  // Not a strict guarantee (someone can grab it between check and submit),
  // just a UX hint. The submit path handles the race properly.
  useEffect(() => {
    if (!clientValid.ok) { setAvailable(null); return }
    let cancelled = false
    const t = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(codename.toLowerCase())}`,
          { credentials: "include" },
        )
        if (!res.ok) return
        const list = await res.json()
        if (cancelled) return
        const exact = list.find(
          (u: any) => u.codename === codename.toLowerCase(),
        )
        setAvailable(!exact)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [codename, clientValid.ok])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientValid.ok) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/users/me/codename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ codename }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? "Failed to set codename")
        return
      }
      // CRITICAL: update auth-context BEFORE navigating away. The codename
      // gate runs on the next render — if the user state still says "no
      // codename", the gate bounces us right back here (that was the bug).
      // We optimistically patch local state, then re-fetch to be sure.
      const normalized = codename.toLowerCase()
      await updateProfile({ codename: normalized })
      await refreshUser()
      router.replace(safeNext)
    } catch (e: any) {
      setError(e?.message ?? "Failed to set codename")
    } finally {
      setSubmitting(false)
    }
  }

  const status = !clientValid.ok
    ? { icon: X, text: clientValid.reason, color: "text-[var(--fg-tertiary)]" }
    : checking
    ? { icon: Loader2, text: "Checking availability...", color: "text-[var(--fg-tertiary)]" }
    : available === true
    ? { icon: Check, text: "Codename is available", color: "text-emerald-500" }
    : available === false
    ? { icon: X, text: "That codename is taken", color: "text-red-500" }
    : null

  return (
    <div className="dark realm min-h-screen relative flex items-center justify-center px-6">
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-5 h-5 text-[var(--fg-tertiary)]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--fg)]">
              Pick your Codename
            </h1>
            <p className="text-sm text-[var(--fg-tertiary)] mt-1">
              This is how team leaders will find and invite you.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2">
                Codename
              </label>
              <input
                type="text"
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                autoComplete="off"
                autoFocus
                placeholder="e.g. nexus_pilot"
                maxLength={20}
                className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
              />
              {status && (
                <div className={`mt-2 text-xs flex items-center gap-1.5 ${status.color}`}>
                  <status.icon className={`w-3.5 h-3.5 ${status.icon === Loader2 ? "animate-spin" : ""}`} />
                  {status.text}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !clientValid.ok ||
                available === false
              }
              className="w-full py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Codename"}
            </button>

            <p className="text-xs text-[var(--fg-tertiary)] text-center">
              Letters, digits, underscore. 3–20 characters. Case-insensitive.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default function CodenameSetupPage() {
  return (
    <Suspense fallback={null}>
      <CodenameSetupInner />
    </Suspense>
  )
}
