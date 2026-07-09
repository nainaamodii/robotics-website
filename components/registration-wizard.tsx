"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Users, Plus, Loader2, Check, AlertCircle, Copy } from "lucide-react"
import WizardStepIndicator from "./wizard-step-indicator"

interface Props {
  competitionId: string
}

export default function RegistrationWizard({ competitionId }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"join" | "create" | null>(null)
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [teamName, setTeamName] = useState("")
  const [teamCode, setTeamCode] = useState("")
  const [validatedTeam, setValidatedTeam] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<{ teamId: string; teamCode?: string; teamName?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const steps = mode === "create"
    ? ["Choose", "Team Name", "Review"]
    : mode === "join"
    ? ["Choose", "Team Code", "Review"]
    : ["Choose"]

  async function validateCode(code: string) {
    if (code.length < 3) { setValidatedTeam(null); return }
    setIsValidating(true)
    try {
      const res = await fetch(`/api/teams/validate-code?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      setValidatedTeam(data.valid ? data.teamName : null)
      if (!data.valid) setError("Invalid team code")
      else setError("")
    } catch {
      setValidatedTeam(null)
    } finally {
      setIsValidating(false)
    }
  }

  async function handleSubmit() {
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode!.toUpperCase(),
          competitionId,
          teamName: mode === "create" ? teamName : undefined,
          teamCode: mode === "join" ? teamCode : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Operation failed")
      const teamId = data._id || data.team?._id || data.value?._id
      setResult({
        teamId,
        teamCode: data.teamCode || data.team?.teamCode,
        teamName: data.teamName || data.team?.name || teamName,
      })
      setStep(steps.length)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function copyCode() {
    if (result?.teamCode) {
      navigator.clipboard.writeText(result.teamCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Success screen
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bento-card p-10 text-center max-w-md mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          {mode === "create" ? "Team Created!" : "Team Joined!"}
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">{result.teamName}</p>

        {result.teamCode && mode === "create" && (
          <div className="mb-8">
            <p className="text-xs text-[var(--text-dim)] mb-2">Share this code with teammates</p>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 transition-colors"
            >
              <span className="text-2xl font-bold tracking-[0.3em] text-[var(--accent-primary)]">
                {result.teamCode}
              </span>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[var(--text-dim)]" />}
            </button>
          </div>
        )}

        <button
          onClick={() => router.push(`/teams/${result.teamId}`)}
          className="px-8 py-3 rounded-xl bg-[var(--accent-primary)] text-black font-semibold text-sm hover:brightness-110 transition-all"
        >
          Go to Team
        </button>
      </motion.div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <WizardStepIndicator steps={steps} currentStep={step} />

      <AnimatePresence mode="wait">
        {/* Step 0: Choose mode */}
        {step === 0 && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)] text-center mb-6">
              How would you like to participate?
            </h2>

            <button
              onClick={() => { setMode("join"); setStep(1) }}
              className="w-full bento-card p-6 text-left hover:border-[var(--accent-secondary)]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)] transition-colors">
                    Join a Team
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">Enter an invite code from your teammates</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-dim)] ml-auto group-hover:text-[var(--accent-secondary)] group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button
              onClick={() => { setMode("create"); setStep(1) }}
              className="w-full bento-card p-6 text-left hover:border-[var(--accent-primary)]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Create a Team
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">Start a new team and invite members</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-dim)] ml-auto group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Step 1: Form */}
        {step === 1 && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bento-card p-8"
          >
            {mode === "join" ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enter Team Code</h2>
                <p className="text-sm text-[var(--text-muted)]">Ask your team leader for the invite code</p>
                <input
                  type="text"
                  placeholder="e.g. RB-X79Z"
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-xl p-4 text-xl tracking-[0.3em] text-center text-[var(--text-primary)] focus:border-[var(--accent-secondary)] focus:outline-none transition-colors"
                  value={teamCode}
                  onChange={e => {
                    const v = e.target.value.toUpperCase()
                    setTeamCode(v)
                    setError("")
                    validateCode(v)
                  }}
                />
                {isValidating && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                    <Loader2 className="w-3 h-3 animate-spin" /> Validating...
                  </div>
                )}
                {validatedTeam && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Check className="w-3 h-3" /> Team: {validatedTeam}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Name Your Team</h2>
                <p className="text-sm text-[var(--text-muted)]">Choose a memorable name for your team</p>
                <input
                  type="text"
                  placeholder="Enter team name"
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                  value={teamName}
                  onChange={e => { setTeamName(e.target.value); setError("") }}
                />
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setStep(0); setMode(null); setError("") }}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] hover:border-[var(--border-hover)] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={mode === "join" ? !validatedTeam : !teamName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bento-card p-8"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Review & Confirm</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-[var(--border-subtle)]">
                <span className="text-sm text-[var(--text-dim)]">Action</span>
                <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{mode} Team</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[var(--border-subtle)]">
                <span className="text-sm text-[var(--text-dim)]">{mode === "join" ? "Team Code" : "Team Name"}</span>
                <span className="text-sm font-medium text-[var(--accent-primary)]">
                  {mode === "join" ? teamCode : teamName}
                </span>
              </div>
              {mode === "join" && validatedTeam && (
                <div className="flex justify-between items-center py-3 border-b border-[var(--border-subtle)]">
                  <span className="text-sm text-[var(--text-dim)]">Team Name</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{validatedTeam}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[var(--text-dim)]">Competition</span>
                <span className="text-sm text-[var(--text-muted)] font-mono">{competitionId}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] hover:border-[var(--border-hover)] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Confirm <Check className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
