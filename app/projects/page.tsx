"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Tag, Database, Filter, Cpu, Loader2 } from "lucide-react"

const categories = ["All", "Competition", "Innovation", "Research"]

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Simulating a delay for the "Boot Sequence" effect (optional, remove delay in prod)
        // await new Promise(resolve => setTimeout(resolve, 1000)); 

        const res = await fetch('/api/projects?published=true')
        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Fetch failed", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return projects
    return projects.filter((p) => p.category === selectedCategory)
  }, [selectedCategory, projects])

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-x-hidden">
      <Navbar />

      {/* --- BACKGROUND: Blueprint Grid --- */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none fixed"
        style={{
          backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Header Section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#E55B5B]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-[#00D4FF]/30 rounded-full mb-6"
          >
            <Database className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-xs font-mono text-[#00D4FF] tracking-widest uppercase">
              Mainframe // Access Granted
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl sm:text-7xl font-black mb-6 text-white uppercase tracking-tight"
          >
            Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E55B5B] to-orange-500">Archives</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-400 max-w-2xl mx-auto font-light"
          >
            Explore the engineering breakthroughs and autonomous systems developed by our R&D division.
          </motion.p>
        </div>
      </section>

      {/* Category Filter Interface */}
      <section className="sticky top-20 z-40 py-4 px-4 backdrop-blur-md border-y border-white/5 bg-neutral-950/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs hidden md:flex">
            <Filter className="w-4 h-4" />
            <span>FILTER_PROTOCOL: ACTIVE</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`relative px-6 py-2 text-sm font-mono uppercase tracking-wider transition-all border border-transparent overflow-hidden group
                  ${selectedCategory === category
                    ? "text-black font-bold"
                    : "text-neutral-400 hover:text-white hover:border-white/20 bg-neutral-900/50"
                  }`}
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
              >
                {/* Active Background Slide */}
                {selectedCategory === category && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#00D4FF]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  {category}
                  {selectedCategory === category && <Cpu className="w-3 h-3 animate-spin-slow" />}
                </span>
              </button>
            ))}
          </div>

          <div className="text-right hidden md:block w-[150px]">
            <span className="text-xs font-mono text-[#E55B5B]">
              {filteredProjects.length} RECORDS FOUND
            </span>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 min-h-[500px]">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-12 h-12 text-[#00D4FF] animate-spin" />
              <p className="font-mono text-[#00D4FF] animate-pulse">FETCHING_DATA...</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {filteredProjects.map((project, index) => (
                  <motion.div
                    layout
                    key={project._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="h-full"
                  >
                    <Link href={`/projects/${project._id}`} className="block h-full">
                      <div className="group h-full flex flex-col bg-neutral-900/40 border border-white/5 overflow-hidden transition-all duration-300 hover:border-[#00D4FF]/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] relative"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)" }}
                      >
                        {/* Image Section */}
                        <div className="relative h-56 overflow-hidden">
                          <div className="absolute inset-0 bg-neutral-800 animate-pulse" /> {/* Placeholder while loading image */}
                          <img
                            src={project.image || "/placeholder.svg"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                            alt={project.title}
                          />

                          {/* Overlay UI */}
                          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />

                          {/* Scanline */}
                          <div className="absolute inset-0 bg-[url('/scanline.png')] opacity-10 pointer-events-none" />

                          <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white rounded-sm">
                            {project.category}
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 flex flex-col flex-1 relative">
                          {/* Decorative line */}
                          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/50 to-transparent" />

                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00D4FF] transition-colors line-clamp-1">
                              {project.title}
                            </h3>
                            <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed">
                              {project.shortDescription}
                            </p>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-xs font-mono text-neutral-500 group-hover:text-white transition-colors">
                              ID: {project._id.slice(-4).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 text-[#E55B5B] text-sm font-bold tracking-wider group-hover:translate-x-1 transition-transform">
                              ACCESS <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>

                        {/* Corner Glow Effect */}
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-[#00D4FF]/20 to-transparent pointer-events-none" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Tag className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Records Found</h3>
              <p className="text-neutral-400">Try adjusting your filter parameters.</p>
            </div>
          )}

        </div>
      </section>
    </div>
  )
}