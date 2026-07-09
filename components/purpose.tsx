"use client"

import { motion } from "framer-motion"
import { Lightbulb, Users, Rocket, Zap } from "lucide-react"
import { useSiteContent } from "@/lib/use-site-content"

const iconMap: Record<string, any> = { Users, Lightbulb, Rocket, Zap }

const defaults = {
  heading: "What we",
  headingAccent: "do",
  cards: [
    { title: "Collaborate", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.", icon: "Users" },
    { title: "Build", description: "Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.", icon: "Lightbulb" },
    { title: "Compete", description: "Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.", icon: "Rocket" },
    { title: "Teach", description: "Maecenas sed diam eget risus varius blandit sit amet non magna. Integer posuere erat a ante venenatis.", icon: "Zap" },
  ],
}

export default function Purpose() {
  const { content } = useSiteContent("purpose", defaults)
  const data = content ?? defaults

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--fg)] tracking-tight">
            {data.heading} <span className="text-[var(--accent)]">{data.headingAccent}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(data.cards ?? []).map((card: any, idx: number) => {
            const Icon = iconMap[card.icon] || Zap
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-2">{card.title}</h3>
                <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{card.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
