"use client"

import { Check } from "lucide-react"

export interface RegistrationInfo {
  state: "open" | "not_yet_open" | "ended" | "closed" | "concluded"
  opensAt: string | null
  closesAt: string | null
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : null
const fmtDay = (d?: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null

export const REGISTRATION_LABEL: Record<RegistrationInfo["state"], string> = {
  open: "Registration open",
  not_yet_open: "Registration opens soon",
  ended: "Registration closed",
  closed: "Registration not open yet",
  concluded: "Mission concluded",
}

/** Registration opens → closes → event starts, with the current state called out. */
export function RegistrationTimeline({
  registration,
  startDate,
  endDate,
}: {
  registration?: RegistrationInfo | null
  startDate?: string | null
  endDate?: string | null
}) {
  if (!registration) return null
  const { state, opensAt, closesAt } = registration
  const rows = [
    { k: "Registration opens", v: fmt(opensAt) ?? (state === "open" ? "Now" : "To be announced"), done: state === "open" || state === "ended" || state === "concluded" },
    { k: "Registration closes", v: fmt(closesAt) ?? "No closing time set", done: state === "ended" || state === "concluded" },
    { k: "Event starts", v: fmtDay(startDate) ?? "To be announced", done: state === "concluded" },
  ]
  return (
    <div className="border border-[var(--border)] p-4">
      <p className={`realm-eyebrow !text-[10px] mb-3 ${state === "open" ? "!text-emerald-400" : ""}`}>{REGISTRATION_LABEL[state]}</p>
      <ol className="space-y-3">
        {rows.map((r) => (
          <li key={r.k} className="flex items-start gap-3">
            <span className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${r.done ? "bg-[var(--fg)] border-[var(--fg)] text-[var(--bg)]" : "border-[var(--border-hover)]"}`}>
              {r.done && <Check className="w-3 h-3" />}
            </span>
            <div className="min-w-0">
              <p className="realm-eyebrow !text-[10px]">{r.k}</p>
              <p className="text-sm text-[var(--fg)] mt-0.5">{r.v}</p>
            </div>
          </li>
        ))}
      </ol>
      {endDate && endDate !== startDate && <p className="mt-3 text-xs text-[var(--fg-tertiary)]">Runs until {fmtDay(endDate)}</p>}
    </div>
  )
}

const STEPS = [
  ["Sign in", "Use your @mnnit.ac.in email — a Google account or a 6-digit code."],
  ["Complete your profile", "Name, mobile number and roll number, one time only."],
  ["Create or join a team", "Leaders create a team and share its code. Members join with that code."],
  ["Submit for approval", "Once the crew is complete, the leader submits it. Admins review."],
]

/** The end-to-end journey, shown on the event page so nobody has to guess where to start. */
export function HowToRegister() {
  return (
    <div className="border border-[var(--border)] p-4">
      <p className="realm-eyebrow !text-[10px] mb-3">How to register</p>
      <ol className="space-y-3">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="font-mono text-[11px] text-[var(--accent)] pt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-sm text-[var(--fg)]">{t}</p>
              <p className="text-xs text-[var(--fg-secondary)] mt-0.5 leading-relaxed">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
