"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react"

const PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  "Gmail (app password)": { host: "smtp.gmail.com", port: 465, secure: true },
  "Outlook / Microsoft 365": { host: "smtp.office365.com", port: 587, secure: false },
  "Zoho": { host: "smtp.zoho.in", port: 465, secure: true },
  "SendGrid": { host: "smtp.sendgrid.net", port: 587, secure: false },
  "Amazon SES (ap-south-1)": { host: "email-smtp.ap-south-1.amazonaws.com", port: 587, secure: false },
}

const input =
  "w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] outline-none transition-colors"
const label = "block text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2"

export function SmtpSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [testTo, setTestTo] = useState("")
  const [form, setForm] = useState({
    host: "", port: 465, secure: true, user: "", password: "", fromEmail: "", fromName: "MNNIT Robotics Club",
  })

  useEffect(() => {
    fetch("/api/admin/smtp", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.host) {
          setForm((f) => ({ ...f, host: d.host, port: d.port, secure: d.secure, user: d.user, fromEmail: d.fromEmail, fromName: d.fromName ?? "" }))
          setHasPassword(!!d.hasPassword)
          setUpdatedAt(d.updatedAt ?? null)
        }
      })
      .catch(() => setMsg({ kind: "err", text: "Could not load SMTP settings" }))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function call(url: string, method: string, body: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const fe = data?.details?.fieldErrors
      const first = fe && Object.entries(fe).map(([k, v]: any) => `${k}: ${v[0]}`)[0]
      throw new Error(first ?? data?.error ?? "Request failed")
    }
    return data
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await call("/api/admin/smtp", "PUT", { ...form, port: Number(form.port), password: form.password || undefined })
      setHasPassword(true)
      set("password", "")
      setUpdatedAt(new Date().toISOString())
      setMsg({ kind: "ok", text: "SMTP settings saved. New verification emails will use them immediately." })
    } catch (err: any) {
      setMsg({ kind: "err", text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function sendTest() {
    setTesting(true)
    setMsg(null)
    try {
      const d = await call("/api/admin/smtp/test", "POST", { to: testTo })
      setMsg({ kind: "ok", text: d.message })
    } catch (err: any) {
      setMsg({ kind: "err", text: err.message })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <h2 className="font-display text-2xl font-bold text-[var(--fg)] mb-2">Email / SMTP</h2>
      <p className="text-[var(--fg-secondary)] mb-8 text-sm">
        Used to email sign-in codes to students. The password is encrypted before it is stored and is never shown again.
        {updatedAt && <> Last saved {new Date(updatedAt).toLocaleString()}.</>}
      </p>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 md:p-8">
        <div>
          <label htmlFor="smtp-preset" className={label}>Provider preset</label>
          <select
            id="smtp-preset"
            defaultValue=""
            onChange={(e) => { const p = PRESETS[e.target.value]; if (p) setForm((f) => ({ ...f, ...p })) }}
            className={input}
          >
            <option value="">Custom</option>
            {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-[1fr_120px] gap-4">
          <div>
            <label htmlFor="smtp-host" className={label}>SMTP host</label>
            <input id="smtp-host" required className={input} value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.example.com" />
          </div>
          <div>
            <label htmlFor="smtp-port" className={label}>Port</label>
            <input id="smtp-port" required type="number" min={1} max={65535} className={input} value={form.port} onChange={(e) => set("port", Number(e.target.value))} />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-[var(--fg)] cursor-pointer">
          <input type="checkbox" checked={form.secure} onChange={(e) => set("secure", e.target.checked)} className="w-4 h-4" />
          Use implicit TLS <span className="text-[var(--fg-tertiary)]">(on for port 465, off for 587/STARTTLS)</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="smtp-user" className={label}>Username</label>
            <input id="smtp-user" required autoComplete="off" className={input} value={form.user} onChange={(e) => set("user", e.target.value)} />
          </div>
          <div>
            <label htmlFor="smtp-pass" className={label}>Password {hasPassword && <span className="normal-case text-emerald-500">· saved</span>}</label>
            <input
              id="smtp-pass"
              type="password"
              autoComplete="new-password"
              required={!hasPassword}
              className={input}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={hasPassword ? "Leave blank to keep current" : ""}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="smtp-from" className={label}>From address</label>
            <input id="smtp-from" required type="email" className={input} value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder="no-reply@yourdomain.com" />
          </div>
          <div>
            <label htmlFor="smtp-name" className={label}>From name</label>
            <input id="smtp-name" className={input} value={form.fromName} onChange={(e) => set("fromName", e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="px-6 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--border)] p-6">
        <label htmlFor="smtp-test" className={label}>Send a test email</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input id="smtp-test" type="email" className={input} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
          <button
            type="button"
            onClick={sendTest}
            disabled={testing || !hasPassword || !testTo.includes("@")}
            className="px-6 py-3 rounded-full border border-[var(--border)] text-sm text-[var(--fg)] hover:border-[var(--fg)] disabled:opacity-40 flex items-center justify-center gap-2 shrink-0"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send test
          </button>
        </div>
        {!hasPassword && <p className="mt-2 text-xs text-[var(--fg-tertiary)]">Save your settings first.</p>}
      </div>

      {msg && (
        <div role="status" className={`mt-6 flex items-start gap-2 rounded-xl border p-3 text-sm ${msg.kind === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"}`}>
          {msg.kind === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}
    </motion.div>
  )
}
