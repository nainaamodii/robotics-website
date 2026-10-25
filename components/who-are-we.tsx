"use client"

import { motion } from "framer-motion"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "About the club",
  description: [
    "MNNIT Robotics Club is a student-led technical community at Motilal Nehru National Institute of Technology, Allahabad. We design, build, and compete with robots — from autonomous vehicles to drones, manipulators, and embedded systems.",
    "Our work spans mechanical design, electronics, computer vision, and software. Members gain hands-on experience through projects, workshops, and national-level competitions.",
  ],
  stats: [
    { label: "Founded", value: "2016" },
    { label: "Active Projects", value: "50+" },
    { label: "Members", value: "120+" },
    { label: "Awards", value: "15+" },
  ],
}

const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

export default function WhoAreWe() {
  const { content } = useSiteContent("who-are-we", defaults)
  const data = content ?? defaults

  return (
    <section id="who-are-we" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          viewport={{ once: true }}
          className="max-w-3xl mb-20"
        >
          <h2 className="font-display uppercase text-[clamp(3rem,8vw,5rem)] text-[var(--fg)] tracking-tight leading-[0.9]">
            {data.heading}
          </h2>
          <div className="mt-8 space-y-5">
            {(data.description ?? []).map((p: string, i: number) => (
              <p key={i} className="font-sans text-lg text-[var(--fg-secondary)] leading-relaxed font-medium">{p}</p>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ease }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)]"
        >
          {(data.stats ?? []).map((stat: any, i: number) => (
            <div key={i} className="bg-[var(--bg)] p-6">
              <p className="font-display text-4xl text-[var(--fg)] mb-1">{stat.value}</p>
              <p className="font-mono uppercase text-xs text-[var(--fg-tertiary)] tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
