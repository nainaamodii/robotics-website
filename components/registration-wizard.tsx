"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowRight, Check, Copy, Loader2, Plus, Users } from "lucide-react"
import WizardStepIndicator from "./wizard-step-indicator"

interface Props {
  competitionId: string
  competitionTitle?: string
  teamSize?: { min: number; max: number }
}

type Result = { teamId: string; teamCode?: string; teamName?: string; pending?: boolean }

const STEPS = ["Crew", "Designation", "Launch"]

export default function RegistrationWizard({ competitionId, competitionTitle, teamSize }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"join" | "create" | null>(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [teamName, setTeamName] = useState("")
  const [teamCode, setTeamCode] = useState("")
  const [validatedTeam, setValidatedTeam] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)

  async function validateCode(code: string) {
    if (code.length < 4) { setValidatedTeam(null); setError(""); return }
    setValidating(true)
    try {
      const res = await fetch(`/api/teams/validate-code?code=${encodeURIComponent(code)}`, { credentials: "include" })
      const data = await res.json()
      if (data.valid) { setValidatedTeam(data.teamName); setError("") }
      else {
        setValidatedTeam(null)
        if (data.reason === "finalized") setError(`"${data.teamName ?? "That team"}" is locked and can't accept new members.`)
        else if (data.reason === "not_found") setError("No team matches that code.")
        else if (data.reason !== "malformed") setError(data.error ?? "Invalid team code")
      }
    } catch {
      setValidatedTeam(null)
      setError("Couldn't verify the code — try again.")
    } finally {
      setValidating(false)
    }
  }

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: mode!.toUpperCase(),
          competitionId,
          teamName: mode === "create" ? teamName : undefined,
          teamCode: mode === "join" ? teamCode : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")
      if (mode === "join" && data.pending) {
        setResult({ teamId: data.teamId, teamName: data.teamName, pending: true })
      } else {
        setResult({
          teamId: data._id || data.team?._id,
          teamCode: data.teamCode || data.team?.teamCode,
          teamName: data.name || data.team?.name || teamName,
        })
      }
      setStep(STEPS.length)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function copyCode() {
    if (!result?.teamCode) return
    navigator.clipboard?.writeText(result.teamCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="realm-panel p-10 text-center">
        <div className="w-14 h-14 border border-white mx-auto mb-6 flex items-center justify-center">
          <Check className="w-6 h-6 text-white" />
        </div>
        <p className="realm-eyebrow mb-3">{result.pending ? "Request transmitted" : mode === "create" ? "Crew registered" : "Crew joined"}</p>
        <h2 className="realm-title text-4xl">{result.teamName}</h2>
        <p className="mt-4 text-sm text-[var(--fg-secondary)]">
          {result.pending
            ? "The team leader will review and approve your request."
            : "Share the crew code below. Submit the roster for admin approval from your team page."}
        </p>
        {result.teamCode && (
          <button onClick={copyCode} className="mt-8 inline-flex items-center gap-4 border border-[var(--border-hover)] px-6 py-4 hover:border-white transition-colors" aria-label="Copy team code">
            <span className="font-mono text-3xl tracking-[0.35em] text-white">{result.teamCode}</span>
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[var(--fg-secondary)]" />}
          </button>
        )}
        <div className="mt-10">
          <button onClick={() => router.push(`/teams/${result.teamId}`)} className="realm-btn">
            Open team <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  const errorBox = error && (
    <div role="alert" className="mt-6 flex items-start gap-2 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
    </div>
  )

  return (
    <div>
      <WizardStepIndicator steps={STEPS} currentStep={step} />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="grid sm:grid-cols-2 gap-3">
            {[
              { m: "create" as const, icon: Plus, title: "Create a team", sub: "You become team leader and get a code to share." },
              { m: "join" as const, icon: Users, title: "Join a team", sub: "Enter the code from your team leader." },
            ].map(({ m, icon: Icon, title, sub }) => (
              <button
                key={m}
                onClick={() => { setMode(m); setStep(1); setError("") }}
                className="realm-panel p-7 text-left group hover:!border-white transition-colors"
              >
                <Icon className="w-5 h-5 text-[var(--accent)] mb-8" />
                <h3 className="text-xl text-white">{title}</h3>
                <p className="mt-2 text-sm text-[var(--fg-secondary)]">{sub}</p>
                <ArrowRight className="mt-8 w-4 h-4 text-[var(--fg-secondary)] group-hover:translate-x-1 group-hover:text-white transition-all" />
              </button>
            ))}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="realm-panel p-8">
            {mode === "join" ? (
              <>
                <label htmlFor="team-code" className="realm-eyebrow block mb-4">Team code</label>
                <input
                  id="team-code"
                  autoFocus
                  autoComplete="off"
                  placeholder="ABC123"
                  value={teamCode}
                  onChange={(e) => { const v = e.target.value.toUpperCase(); setTeamCode(v); setError(""); validateCode(v) }}
                  className="w-full bg-transparent border border-[var(--border)] focus:border-white px-4 py-4 text-2xl font-mono tracking-[0.35em] text-center text-white outline-none transition-colors"
                />
                <div className="mt-3 h-5 text-xs">
                  {validating && <span className="flex items-center gap-2 text-[var(--fg-tertiary)]"><Loader2 className="w-3 h-3 animate-spin" /> Checking…</span>}
                  {validatedTeam && <span className="flex items-center gap-2 text-emerald-400"><Check className="w-3 h-3" /> {validatedTeam}</span>}
                </div>
              </>
            ) : (
              <>
                <label htmlFor="team-name" className="realm-eyebrow block mb-4">Team name</label>
                <input
                  id="team-name"
                  autoFocus
                  maxLength={60}
                  placeholder="e.g. Nexus Vanguard"
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setError("") }}
                  className="w-full bg-transparent border border-[var(--border)] focus:border-white px-4 py-4 text-xl text-white placeholder:text-[var(--fg-tertiary)] outline-none transition-colors"
                />
                {teamSize && (
                  <p className="mt-3 text-xs text-[var(--fg-tertiary)]">
                    This competition takes crews of {teamSize.min === teamSize.max ? teamSize.min : `${teamSize.min}–${teamSize.max}`}.
                  </p>
                )}
              </>
            )}
            {errorBox}
            <div className="mt-8 flex gap-3">
              <button onClick={() => { setStep(0); setMode(null); setError("") }} className="realm-btn realm-btn-ghost">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(2)} disabled={mode === "join" ? !validatedTeam : !teamName.trim()} className="realm-btn flex-1">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="realm-panel p-8">
            <p className="realm-eyebrow mb-6">Pre-launch checklist</p>
            <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {[
                ["Mission", competitionTitle ?? "—"],
                ["Action", mode === "join" ? "Join team" : "Create team"],
                [mode === "join" ? "Team" : "Team name", mode === "join" ? `${validatedTeam} (${teamCode})` : teamName],
                ["Identity", "Email verified"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-4 text-sm">
                  <dt className="realm-eyebrow !text-[10px]">{k}</dt>
                  <dd className="text-white text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {errorBox}
            <div className="mt-8 flex gap-3">
              <button onClick={() => setStep(1)} className="realm-btn realm-btn-ghost"><ArrowLeft className="w-4 h-4" /> Back</button>
              <button onClick={submit} disabled={busy} className="realm-btn flex-1">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm registration <Check className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
