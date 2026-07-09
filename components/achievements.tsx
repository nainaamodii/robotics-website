"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "In the",
  headingAccent: "press",
  items: [
    { title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod", source: "Times of India", date: "Dec 2019", category: "Automotive" },
    { title: "Suspendisse varius enim in eros elementum tristique duis cursus", source: "Dainik Bhaskar", date: "Aug 2021", category: "Biomedical" },
    { title: "Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet nunc", source: "Jagran News", date: "Feb 2023", category: "Defense" },
  ],
}

export default function Achievements() {
  const { content } = useSiteContent("achievements", defaults)
  const data = content ?? defaults

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-5xl font-bold text-[var(--fg)] tracking-tight mb-12"
        >
          {data.heading} <span className="text-[var(--accent)]">{data.headingAccent}</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {(data.items ?? []).map((item: any, idx: number) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)] transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[var(--accent)]">{item.source}</span>
                <span className="text-xs text-[var(--fg-tertiary)] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)]">
                  {item.category}
                </span>
              </div>
              <h3 className="text-[var(--fg)] font-medium leading-snug mb-6 group-hover:text-[var(--accent)] transition-colors">
                {item.title}
              </h3>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--fg-tertiary)]">{item.date}</span>
                <ArrowUpRight className="w-4 h-4 text-[var(--fg-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
