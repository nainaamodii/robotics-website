"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useSiteContent } from "@/lib/use-site-content"
import TimelineNode from "./timeline-node"

const defaultContent = {
  heading: "The Self-Driving Car Journey",
  milestones: [] as any[],
}

export default function CarTimeline() {
  const { content } = useSiteContent("car-timeline", defaultContent)
  const data = content ?? defaultContent
  const milestones = data.milestones ?? []

  const containerRef = useRef<HTMLDivElement>(null!)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const x = useTransform(scrollYProgress, [0, 1], ["5%", `-${Math.max(0, milestones.length * 25 - 80)}%`])

  if (milestones.length === 0) {
    return <div ref={containerRef} className="hidden" />
  }

  return (
    <section ref={containerRef} className="py-28 bg-[var(--bg-deep)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 mb-4">
            <span className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse" />
            <span className="text-xs text-[var(--accent-primary)] tracking-widest uppercase">Timeline</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]">
            {data.heading}
          </h2>
        </motion.div>
      </div>

      {/* Desktop: horizontal scroll */}
      <div className="hidden md:block h-[250vh] relative">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <motion.div style={{ x }} className="flex gap-8 px-16">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />
            {milestones.map((milestone: any, idx: number) => (
              <TimelineNode key={idx} milestone={milestone} index={idx} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden px-4 space-y-6">
        <div className="relative border-l-2 border-[var(--border-subtle)] ml-6 pl-8 space-y-10">
          {milestones.map((milestone: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-deep)]" />
              <span className="text-xs text-[var(--accent-primary)] mb-1 block">{milestone.date}</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{milestone.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{milestone.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
