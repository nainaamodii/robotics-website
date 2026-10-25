"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

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

const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

function pickAcrossDomains(projects: Project[], max: number): Project[] {
  const byCategory = new Map<string, Project[]>()
  for (const p of projects) {
    const cat = p.category || "Other"
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(p)
  }
  const result: Project[] = []
  const cats = Array.from(byCategory.keys())
  let round = 0
  while (result.length < max && round < projects.length) {
    for (const cat of cats) {
      const arr = byCategory.get(cat)!
      if (round < arr.length && result.length < max) {
        result.push(arr[round])
      }
    }
    round++
  }
  return result
}

export default function BentoProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState("All")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/projects?published=true&limit=100")
      .then(res => res.json())
      .then(data => {
        const all: Project[] = Array.isArray(data) ? data : data.projects ?? []
        const picked = pickAcrossDomains(all, 6)
        setProjects(picked)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const categories = ["All", ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))]
  const filtered = filter === "All" ? projects : projects.filter(p => p.category === filter)

  if (isLoading) {
    return (
      <section id="projects" className="py-20 md:py-28 px-6 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[200px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`rounded-none bg-[var(--bg-secondary)] border border-[var(--border)] animate-pulse ${spanPatterns[i] || ""}`} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (projects.length === 0) return null

  return (
    <section id="projects" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <h2 className="font-display uppercase text-[clamp(3rem,8vw,5rem)] text-[var(--fg)] tracking-tight leading-[0.9] mb-4">
            Featured<br />Projects.
          </h2>
          <p className="font-sans text-lg text-[var(--fg-secondary)] max-w-2xl font-medium leading-relaxed">
            A snapshot of our ongoing builds — from autonomous vehicles to industrial manipulators. Each project is an open lab for learning.
          </p>
        </motion.div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider transition-colors ${
                filter === cat
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "bg-[var(--bg)] text-[var(--fg-secondary)] border border-[var(--border)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[220px]">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, idx) => (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05, ease }}
                className={`group relative overflow-hidden rounded-none border border-[var(--border)] cursor-pointer ${spanPatterns[idx % spanPatterns.length]}`}
              >
                {project.image ? (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
                )}

                <div className="relative z-10 h-full flex flex-col justify-between p-5">
                  <div className="flex items-center gap-2">
                    {project.category && (
                      <span className="px-3 py-1 rounded-full bg-black/80 font-mono uppercase text-[10px] text-white tracking-wider">
                        {project.category}
                      </span>
                    )}
                    {project.status && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 font-mono uppercase text-[10px] text-white tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                        {project.status}
                      </span>
                    )}
                  </div>

                  <h3 className={`font-sans text-base font-medium ${project.image ? "text-white" : "text-[var(--fg)]"}`}>
                    {project.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] font-mono uppercase text-xs tracking-wider text-[var(--fg)] transition-colors hover:bg-[var(--bg-secondary)]"
          >
            View All Projects
          </Link>
        </div>
      </div>
    </section>
  )
}
