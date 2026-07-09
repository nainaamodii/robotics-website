"use client"

import { motion } from "framer-motion"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "About",
  headingAccent: "the club",
  description: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.",
  ],
  stats: [
    { label: "Founded", value: "2016" },
    { label: "Projects", value: "50+" },
    { label: "Members", value: "120+" },
    { label: "Awards", value: "15+" },
  ],
}

export default function WhoAreWe() {
  const { content } = useSiteContent("who-are-we", defaults)
  const data = content ?? defaults

  return (
    <section id="who-are-we" className="py-24 lg:py-32 px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--fg)] mb-8 tracking-tight">
              {data.heading}{" "}
              <span className="text-[var(--accent)]">{data.headingAccent}</span>
            </h2>
            <div className="space-y-5">
              {(data.description ?? []).map((p: string, i: number) => (
                <p key={i} className="text-[var(--fg-secondary)] leading-relaxed text-lg">{p}</p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            {(data.stats ?? []).map((stat: any, i: number) => (
              <div key={i} className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="font-display text-3xl font-bold text-[var(--fg)] mb-1">{stat.value}</p>
                <p className="text-sm text-[var(--fg-tertiary)]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
