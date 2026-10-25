"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "In the press",
  items: [
    { title: "MNNIT students build self-driving car prototype, demonstrate autonomous navigation on campus", source: "Times of India", date: "Dec 2019", category: "Automotive" },
    { title: "Robotics Club wins top honors at national e-Yantra competition hosted by IIT Bombay", source: "Dainik Bhaskar", date: "Aug 2021", category: "Competition" },
    { title: "Student team develops low-cost robotic arm for agricultural applications in rural India", source: "Jagran News", date: "Feb 2023", category: "Innovation" },
  ],
}

const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

export default function Achievements() {
  const { content } = useSiteContent("achievements", defaults)
  const data = content ?? defaults

  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          viewport={{ once: true }}
          className="font-display uppercase text-[clamp(3rem,8vw,5rem)] text-[var(--fg)] tracking-tight leading-[0.9] mb-14"
        >
          {data.heading}
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-3">
          {(data.items ?? []).map((item: any, idx: number) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, ease }}
              viewport={{ once: true }}
              className="group p-6 rounded-none bg-[var(--bg)] border border-[var(--border)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono uppercase text-xs text-[var(--fg-tertiary)] tracking-wider">{item.source}</span>
                <span className="font-mono uppercase text-[10px] text-[var(--fg-tertiary)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                  {item.category}
                </span>
              </div>
              <h3 className="font-sans text-base font-medium text-[var(--fg)] leading-snug mb-6 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-2" />
                <span>{item.title}</span>
              </h3>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="font-mono uppercase text-xs text-[var(--fg-tertiary)]">{item.date}</span>
                <ArrowUpRight className="w-4 h-4 text-[var(--fg-tertiary)]" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
