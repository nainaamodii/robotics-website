"use client"

import { motion } from "framer-motion"

interface Milestone {
  title: string
  date: string
  description: string
  contributors?: { name: string; role?: string }[]
}

export default function TimelineNode({ milestone, index }: { milestone: Milestone; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex-shrink-0 w-[350px] relative group"
    >
      {/* Connector dot */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 rounded-full bg-[var(--accent-primary)] border-4 border-[var(--bg-deep)] group-hover:scale-125 transition-transform" />
      </div>

      <div className="mt-8 bento-card p-6 hover:border-[var(--accent-primary)]/30 transition-all duration-300">
        <span className="text-xs text-[var(--accent-primary)] font-medium mb-2 block">{milestone.date}</span>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
          {milestone.title}
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{milestone.description}</p>

        {milestone.contributors && milestone.contributors.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
            {milestone.contributors.map((c, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-dim)]">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
