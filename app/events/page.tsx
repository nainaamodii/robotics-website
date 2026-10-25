"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Calendar, ChevronDown, Loader2, MapPin, Users } from "lucide-react"
import RealmPage, { Eyebrow } from "@/components/realm/realm-page"
import { HowToRegister, RegistrationTimeline, REGISTRATION_LABEL } from "@/components/realm/registration-timeline"

const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming")

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return
        setEvents(data)
        if (!data.some((e: any) => e.status === "upcoming") && data.length) setTab("past")
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = useMemo(() => events.filter((e) => e.status === "upcoming"), [events])
  const past = useMemo(() => events.filter((e) => e.status !== "upcoming"), [events])
  const shown = tab === "upcoming" ? upcoming : past

  return (
    <RealmPage>
      <section className="px-6 pt-20 pb-14 md:pt-28">
        <div className="max-w-[1200px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
            <Eyebrow index="01">Mission manifest</Eyebrow>
            <h1 className="realm-title mt-6 text-[clamp(4rem,14vw,12rem)]">Missions</h1>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--fg-secondary)]">
              Workshops, hackathons and inter-college competitions. Pick a mission, form your crew,
              and register — every crew member is email-verified.
            </p>
          </motion.div>

          <div role="tablist" aria-label="Mission status" className="mt-12 flex gap-8 border-b border-[var(--border)]">
            {(["upcoming", "past"] as const).map((t) => {
              const count = t === "upcoming" ? upcoming.length : past.length
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`relative pb-4 text-xs uppercase tracking-[0.22em] transition-colors ${
                    tab === t ? "text-[var(--fg)]" : "text-[var(--fg-tertiary)] hover:text-[var(--fg)]"
                  }`}
                >
                  {t === "upcoming" ? "Upcoming" : "Completed"} <span className="ml-1 text-[var(--fg-tertiary)]">{count}</span>
                  {tab === t && <motion.span layoutId="tab-line" className="absolute inset-x-0 -bottom-px h-px bg-[var(--fg)]" />}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[var(--fg-tertiary)]" /></div>
      ) : shown.length === 0 ? (
        <section className="px-6 pb-32">
          <div className="max-w-[1200px] mx-auto realm-panel p-16 text-center">
            <p className="realm-eyebrow">No {tab === "upcoming" ? "upcoming" : "completed"} missions</p>
            <p className="mt-3 text-sm text-[var(--fg-secondary)]">
              {tab === "upcoming" ? "New missions are announced at the start of each semester." : "Nothing in the archive yet."}
            </p>
          </div>
        </section>
      ) : (
        shown.map((event, i) => <EventSection key={event._id} event={event} index={i} past={tab === "past"} />)
      )}
    </RealmPage>
  )
}

function EventSection({ event, index, past }: { event: any; index: number; past: boolean }) {
  const comps: any[] = event.competitions ?? []
  return (
    <section className="px-6 py-16 border-t border-[var(--border)]">
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
        >
          <Eyebrow index={String(index + 1).padStart(2, "0")}>{past ? "Completed" : "Open for crews"}</Eyebrow>
          <h2 className="realm-title mt-5 text-[clamp(2.75rem,6vw,5rem)]">{event.name}</h2>
          {event.tagline && <p className="mt-4 text-lg text-[var(--fg)]">{event.tagline}</p>}
          <p className="mt-4 text-sm leading-relaxed text-[var(--fg-secondary)]">{event.description}</p>

          <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-px bg-[var(--border)] border border-[var(--border)]">
            {[
              { icon: Calendar, k: "Date", v: event.date },
              { icon: MapPin, k: "Location", v: event.location },
              { icon: Users, k: "Crew", v: event.participantsLabel || "Open for all" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="bg-[var(--bg)] p-4 flex items-center gap-4">
                <Icon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <div className="min-w-0">
                  <dt className="realm-eyebrow !text-[10px]">{k}</dt>
                  <dd className="text-sm text-[var(--fg)] mt-1 truncate">{v || "TBA"}</dd>
                </div>
              </div>
            ))}
          </dl>

          {!past && (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <RegistrationTimeline registration={event.registration} startDate={event.startDate} endDate={event.endDate} />
              <HowToRegister />
            </div>
          )}

          {event.highlights?.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {event.highlights.map((h: string) => (
                <li key={h} className="realm-eyebrow !text-[10px] border border-[var(--border)] px-3 py-1.5">{h}</li>
              ))}
            </ul>
          )}
        </motion.div>

        <div>
          <p className="realm-eyebrow mb-4 flex justify-between">
            <span>Competitions</span><span>{comps.length}</span>
          </p>
          {comps.length === 0 ? (
            <div className="realm-panel p-10 text-sm text-[var(--fg-secondary)]">
              {past ? "No competitions were listed for this mission." : "Competitions will be announced soon."}
            </div>
          ) : (
            <div className="space-y-3">
              {comps.map((c, i) => <CompetitionRow key={c._id} data={c} index={i} past={past} event={event} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CompetitionRow({ data, index, past, event }: { data: any; index: number; past: boolean; event: any }) {
  const [open, setOpen] = useState(false)
  const panelId = `comp-${data._id}`
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, ease }}
      className={`realm-panel transition-colors ${open ? "!border-[var(--border-hover)]" : ""}`}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full p-5 flex items-center justify-between gap-4 text-left"
      >
        <div>
          <h3 className="text-lg text-[var(--fg)] font-medium">{data.title}</h3>
          <p className="realm-eyebrow !text-[10px] mt-2">
            {data.type} · Crew of {data.minTeamSize === data.maxTeamSize ? data.minTeamSize : `${data.minTeamSize}–${data.maxTeamSize}`}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--fg-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <div className="p-5 grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm leading-relaxed text-[var(--fg-secondary)] mb-6">{data.description}</p>
                {past ? (
                  <p className="realm-eyebrow">Mission concluded</p>
                ) : data.registration?.state === "open" ? (
                  <Link href={`/participate/${data._id}`} className="realm-btn w-full">
                    Register crew <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div>
                    <button disabled className="realm-btn w-full">{REGISTRATION_LABEL[data.registration?.state as keyof typeof REGISTRATION_LABEL] ?? "Registration not open yet"}</button>
                    {data.registration?.state === "not_yet_open" && data.registration.opensAt && (
                      <p className="mt-3 text-xs text-[var(--fg-secondary)]">
                        Opens {new Date(data.registration.opensAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {data.rules?.length > 0 && (
                <div className="border border-[var(--border)] p-4">
                  <p className="realm-eyebrow !text-[10px] mb-3">Rules of engagement</p>
                  <ul className="space-y-2">
                    {data.rules.map((r: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-[var(--fg-secondary)]">
                        <span className="mt-2 w-1 h-1 bg-[var(--accent)] shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
