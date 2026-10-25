"use client"

import { motion } from "framer-motion"
import { Users, Lightbulb, Rocket, Zap } from "lucide-react"
import { useSiteContent } from "@/lib/use-site-content"

const iconMap: Record<string, any> = { Users, Lightbulb, Rocket, Zap }

const defaults = {
  heading: "What we do",
  cards: [
    { title: "Collaborate", description: "Work in cross-functional teams of mechanical, electronics, and software engineers to tackle real engineering challenges.", icon: "Users" },
    { title: "Build", description: "Design and fabricate robots from scratch — CAD, PCB design, 3D printing, embedded firmware, and full-stack software.", icon: "Lightbulb" },
    { title: "Compete", description: "Represent MNNIT at national and international robotics competitions including IGVC, Robocon, and e-Yantra.", icon: "Rocket" },
    { title: "Teach", description: "Conduct workshops, bootcamps, and mentorship programs to help new members build foundational robotics skills.", icon: "Zap" },
  ],
}

const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

export default function Purpose() {
  const { content } = useSiteContent("purpose", defaults)
  const data = content ?? defaults

  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          viewport={{ once: true }}
          className="font-display uppercase text-[clamp(3rem,8vw,5rem)] text-[var(--fg)] tracking-tight leading-[0.9] mb-16"
        >
          {data.heading}
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(data.cards ?? []).map((card: any, idx: number) => {
            const Icon = iconMap[card.icon] || Zap
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, ease }}
                viewport={{ once: true }}
                className="p-6 rounded-none bg-[var(--bg)] border border-[var(--border)]"
              >
                <div className="w-10 h-10 rounded-none border border-[var(--border)] flex items-center justify-center mb-5">
                  <Icon className="w-4 h-4 text-[var(--fg-tertiary)]" />
                </div>
                <h3 className="font-sans text-lg font-medium text-[var(--fg)] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--fg-secondary)] leading-relaxed font-medium">{card.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
