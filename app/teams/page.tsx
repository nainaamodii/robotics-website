"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Loader2, Users } from "lucide-react"
import RealmPage, { Eyebrow } from "@/components/realm/realm-page"
import { useAuth } from "@/lib/auth-context"

interface MyTeam {
  _id: string
  name: string
  teamCode: string
  approvalStatus?: "draft" | "submitted" | "approved" | "rejected"
  isFinalized?: boolean
  leaderId: string
  competitionName?: string
  eventName?: string
  eventDate?: string
  minTeamSize?: number
  maxTeamSize?: number
  members: { _id: string }[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Assembling", cls: "text-[var(--fg-secondary)] border-[var(--border-hover)]" },
  submitted: { label: "Awaiting approval", cls: "text-amber-300 border-amber-400/40" },
  approved: { label: "Cleared for launch", cls: "text-emerald-700 dark:text-emerald-300 border-emerald-400/40" },
  rejected: { label: "Needs changes", cls: "text-red-700 dark:text-red-300 border-red-400/40" },
}

export default function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<MyTeam[] | null>(null)

  useEffect(() => {
    fetch("/api/user/team", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTeams)
      .catch(() => setTeams([]))
  }, [])

  return (
    <RealmPage>
      <section className="px-6 pt-20 pb-24 md:pt-28">
        <div className="max-w-[1200px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Eyebrow index="03">Your crews</Eyebrow>
            <h1 className="realm-title mt-6 text-[clamp(4rem,13vw,10rem)]">My Teams</h1>
          </motion.div>

          <div className="mt-14">
            {teams === null ? (
              <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" /></div>
            ) : teams.length === 0 ? (
              <div className="realm-panel p-14 text-center">
                <Users className="w-6 h-6 mx-auto text-[var(--fg-tertiary)] mb-4" />
                <p className="realm-eyebrow">No crews yet</p>
                <p className="mt-3 text-sm text-[var(--fg-secondary)]">Pick a mission and register to create or join a team.</p>
                <Link href="/events" className="realm-btn mt-8">Browse missions <ArrowRight className="w-4 h-4" /></Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {teams.map((t, i) => {
                  const status = t.approvalStatus ?? (t.isFinalized ? "approved" : "draft")
                  const st = STATUS[status]
                  const leader = String(t.leaderId) === String(user?._id)
                  return (
                    <motion.div key={t._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Link href={`/teams/${t._id}`} className="realm-panel p-7 block group hover:!border-[var(--fg)] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <p className="realm-eyebrow !text-[10px]">{t.eventName ?? "Mission"}</p>
                          <span className={`realm-eyebrow !text-[10px] border px-2.5 py-1 ${st.cls}`}>{st.label}</span>
                        </div>
                        <h2 className="realm-title mt-6 text-4xl">{t.name}</h2>
                        <p className="mt-2 text-sm text-[var(--fg-secondary)]">{t.competitionName}</p>
                        <div className="mt-8 pt-5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--fg-secondary)]">
                          <span className="inline-flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> {t.members.length}
                            {t.maxTeamSize ? ` / ${t.maxTeamSize}` : ""} {leader && <span className="text-[var(--accent)]">· Leader</span>}
                          </span>
                          <span className="font-mono tracking-[0.3em] text-[var(--fg)]">{t.teamCode}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </RealmPage>
  )
}
