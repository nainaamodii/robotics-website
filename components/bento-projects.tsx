"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import ProjectHudOverlay from "./project-hud-overlay"

interface Project {
  _id: string
  title: string
  description: string
  category: string
  status: string
  techStack: string[]
  image?: string
  slug?: string
}

const spanPatterns = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-1 md:row-span-1",
]

export default function BentoProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState("All")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : data.projects ?? [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const categories = ["All", ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))]
  const filtered = filter === "All" ? projects : projects.filter(p => p.category === filter)

  if (isLoading) {
    return (
      <section className="py-28 px-4 bg-[var(--bg-deep)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`bento-card animate-pulse ${spanPatterns[i] || ""}`} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (projects.length === 0) return null

  return (
    <section className="py-28 px-4 bg-[var(--bg-deep)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/20 mb-4">
              <span className="w-1.5 h-1.5 bg-[var(--accent-secondary)] rounded-full animate-pulse" />
              <span className="text-xs text-[var(--accent-secondary)] tracking-widest uppercase">Portfolio</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-orange-400">Projects</span>
            </h2>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  filter === cat
                    ? "bg-[var(--accent-primary)] text-black"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, idx) => (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 transition-all duration-300 cursor-pointer ${spanPatterns[idx % spanPatterns.length]}`}
              >
                {project.image && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-deep)] via-[var(--bg-deep)]/60 to-transparent z-[1]" />

                <div className="relative z-10 h-full flex flex-col justify-end p-5">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{project.description}</p>
                </div>

                <ProjectHudOverlay project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-10 text-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all"
          >
            View All Projects
          </Link>
        </div>
      </div>
    </section>
  )
}
