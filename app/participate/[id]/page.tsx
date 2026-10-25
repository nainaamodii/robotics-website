"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Loader2, MapPin, ShieldCheck, ShieldAlert } from "lucide-react"
import RealmPage, { Eyebrow } from "@/components/realm/realm-page"
import RegistrationWizard from "@/components/registration-wizard"
import { useAuth } from "@/lib/auth-context"

const BLOCK_COPY: Record<string, string> = {
  registration_closed: "Registration for this competition is closed.",
  event_concluded: "This event has concluded.",
}

export default function ParticipatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: competitionId } = use(params)
  const { user, isLoading: authLoading } = useAuth()
  const [ctx, setCtx] = useState<any>(null)
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "error">("loading")

  useEffect(() => {
    fetch(`/api/participate?competitionId=${encodeURIComponent(competitionId)}`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 404) return setStatus("missing")
        if (!r.ok) return setStatus("error")
        setCtx(await r.json())
        setStatus("ok")
      })
      .catch(() => setStatus("error"))
  }, [competitionId])

  const verified = !!user?.emailVerified

  return (
    <RealmPage footer={false}>
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          {status === "loading" || authLoading ? (
            <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" /></div>
          ) : status !== "ok" ? (
            <Notice title={status === "missing" ? "Mission not found" : "Couldn't load this mission"} body="Return to the manifest and pick another." />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Eyebrow index="02">Launch sequence</Eyebrow>
              <h1 className="realm-title mt-5 text-[clamp(2.75rem,8vw,6rem)]">{ctx.competition.title}</h1>
              <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--fg-secondary)]">
                <span>{ctx.event.name}</span>
                {ctx.event.date && <span className="inline-flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{ctx.event.date}</span>}
                {ctx.event.location && <span className="inline-flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{ctx.event.location}</span>}
              </p>

              <div className={`mt-8 flex items-center gap-3 border p-4 text-sm ${verified ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/40 text-amber-200"}`}>
                {verified ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                {verified
                  ? <span>Email verified — <span className="text-white">{user?.email}</span></span>
                  : <span>Your email isn&apos;t verified. <Link href={`/auth/signin?next=/participate/${competitionId}`} className="underline underline-offset-4 text-white">Sign in with a code</Link> to register.</span>}
              </div>

              <div className="mt-10">
                {ctx.registration ? (
                  <div className="realm-panel p-8">
                    <p className="realm-eyebrow mb-3">You&apos;re registered · {ctx.registration.approvalStatus}</p>
                    <h2 className="realm-title text-4xl">{ctx.registration.teamName}</h2>
                    <Link href={`/teams/${ctx.registration.teamId}`} className="realm-btn mt-8">Open team <ArrowRight className="w-4 h-4" /></Link>
                  </div>
                ) : !ctx.canRegister ? (
                  <Notice title="Registration unavailable" body={BLOCK_COPY[ctx.blockedReason] ?? "You can't register right now."} />
                ) : verified ? (
                  <RegistrationWizard
                    competitionId={competitionId}
                    competitionTitle={ctx.competition.title}
                    teamSize={{ min: ctx.competition.minTeamSize, max: ctx.competition.maxTeamSize }}
                  />
                ) : null}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </RealmPage>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="realm-panel p-10 text-center">
      <p className="realm-eyebrow mb-3">{title}</p>
      <p className="text-sm text-[var(--fg-secondary)]">{body}</p>
      <Link href="/events" className="realm-btn realm-btn-ghost mt-8">Back to missions</Link>
    </div>
  )
}
