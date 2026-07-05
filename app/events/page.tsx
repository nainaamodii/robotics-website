"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Calendar, MapPin, Users, Zap, Trophy, ChevronDown, ChevronUp, AlertCircle, Terminal, Swords, Cpu, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeEventId, setActiveEventId] = useState<string>("")

  // FETCH REAL DATA FROM API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data)
          setActiveEventId(data[0]._id) // Set first event as active
        }
      } catch (error) {
        console.error("Failed to fetch events:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
      </div>
    )
  }

  // Fallback if no events found in DB
  if (events.length === 0) {
    return (
      <main className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="pt-32 text-center text-neutral-400">
          <h1 className="text-2xl font-bold mb-2">No Events Found</h1>
          <p>Please seed the database with events and competitions.</p>
        </div>
      </main>
    )
  }

  const activeEvent = events.find(e => e._id === activeEventId) || events[0]
  const isRed = activeEvent.theme === 'red'
  const themeColor = isRed ? '#E55B5B' : '#00D4FF'

  return (
    <main className="min-h-screen bg-neutral-950 relative overflow-x-hidden">
      <Navbar />

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none fixed transition-colors duration-1000"
        style={{
          backgroundImage: `linear-gradient(${themeColor} 1px, transparent 1px), linear-gradient(90deg, ${themeColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            key={activeEventId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/10 rounded-full mb-6">
              <Terminal className="w-4 h-4" style={{ color: themeColor }} />
              <span className="text-xs font-mono uppercase tracking-widest text-white">
                System Event Log
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4">
              {activeEvent.name}
            </h1>
            <p className="text-xl md:text-2xl font-mono" style={{ color: themeColor }}>
                // {activeEvent.tagline}
            </p>
          </motion.div>

          {/* Event Switcher Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {events.map((event) => (
              <button
                key={event._id}
                onClick={() => setActiveEventId(event._id)}
                className={`relative px-8 py-4 text-lg font-bold uppercase tracking-wider transition-all duration-300 clip-path-button group overflow-hidden ${activeEventId === event._id
                  ? 'text-black'
                  : 'text-neutral-500 hover:text-white bg-neutral-900/50'
                  }`}
                style={{
                  clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"
                }}
              >
                {activeEventId === event._id && (
                  <motion.div
                    layoutId="activeEventTab"
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: event.theme === 'red' ? '#E55B5B' : '#00D4FF' }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {event.theme === 'red' ? <Swords className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                  {event.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- MAIN DASHBOARD --- */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Event Overview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <motion.div
                key={`${activeEventId}-info`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 bg-neutral-900/80 backdrop-blur-md border border-white/10 relative overflow-hidden group"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: themeColor }} />

                <h3 className="text-2xl font-bold text-white mb-6">Mission Brief</h3>
                <p className="text-neutral-400 mb-8 leading-relaxed">
                  {activeEvent.description}
                </p>

                <div className="space-y-4 font-mono text-sm">
                  <div className="flex items-center gap-4 text-neutral-300">
                    <Calendar className="w-5 h-5" style={{ color: themeColor }} />
                    {activeEvent.date}
                  </div>
                  <div className="flex items-center gap-4 text-neutral-300">
                    <MapPin className="w-5 h-5" style={{ color: themeColor }} />
                    {activeEvent.location}
                  </div>
                  <div className="flex items-center gap-4 text-neutral-300">
                    <Users className="w-5 h-5" style={{ color: themeColor }} />
                    {activeEvent.participantsLabel || "Open For All"}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Highlights</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeEvent.highlights?.map((h: string) => (
                      <span key={h} className="px-2 py-1 bg-white/5 text-xs rounded-sm text-neutral-300 border border-white/5">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT COLUMN: Competitions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Active Competitions
              </h3>
              <span className="text-xs font-mono text-neutral-500">
                {activeEvent.competitions?.length || 0} MODULES LOADED
              </span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode='wait'>
                {activeEvent.competitions?.map((comp: any, idx: number) => (
                  <CompetitionCard
                    key={comp._id}
                    data={comp}
                    themeColor={themeColor}
                    index={idx}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}

// Keep your existing CompetitionCard component exactly as it was, 
// just ensure key prop uses `comp._id`
function CompetitionCard({ data, themeColor, index }: { data: any, themeColor: string, index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-neutral-900/40 border ${isOpen ? 'border-opacity-100' : 'border-opacity-10'} border-white transition-all duration-300 overflow-hidden`}
      style={{
        borderColor: isOpen ? themeColor : 'rgba(255,255,255,0.1)',
        clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
      }}
    >
      <div
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-neutral-800 flex items-center justify-center border border-white/5">
            <Zap className="w-6 h-6" style={{ color: isOpen ? themeColor : '#666' }} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">{data.title}</h4>
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 mt-1">
              <span className="px-2 py-0.5 bg-white/5 rounded-sm uppercase">{data.type}</span>
              <span>•</span>
              {/* Fallback for fields that might be optional in DB */}
              <span>{data.minTeamSize}-{data.maxTeamSize} Members</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className={`hidden md:block text-xs font-bold uppercase tracking-wider px-4 py-2 border transition-all ${isOpen ? 'bg-white text-black border-white' : 'text-neutral-400 border-white/10'}`}>
            {isOpen ? 'Close Intel' : 'View Intel'}
          </button>
          {isOpen ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
              <div>
                <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" style={{ color: themeColor }} />
                  Objective
                </h5>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                  {data.description}
                </p>
                <Link href={`/participate/${data._id}`}>
                  <button
                    className="w-full py-3 text-black font-bold uppercase text-sm tracking-wider hover:brightness-110 transition-all"
                    style={{ backgroundColor: themeColor, clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                  >
                    Participate Now
                  </button>
                </Link>
              </div>

              <div className="bg-neutral-950/50 p-6 rounded-sm border border-white/5">
                <h5 className="text-sm font-bold text-white mb-4 font-mono uppercase tracking-wider border-b border-white/10 pb-2">
                  Engagement Protocols
                </h5>
                <ul className="space-y-3">
                  {data.rules?.map((rule: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: themeColor }} />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}