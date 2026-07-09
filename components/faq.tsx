"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "Frequently asked",
  headingAccent: "questions",
  items: [
    { question: "Do I need prior coding experience?", answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    { question: "Does the club provide components?", answer: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
    { question: "Can students from any branch join?", answer: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
    { question: "How do I participate in competitions?", answer: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
  ],
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { content } = useSiteContent("faq", defaults)
  const data = content ?? defaults

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-5xl font-bold text-[var(--fg)] tracking-tight mb-12 text-center"
        >
          {data.heading} <span className="text-[var(--accent)]">{data.headingAccent}</span>
        </motion.h2>

        <div className="divide-y divide-[var(--border)]">
          {(data.items ?? []).map((faq: any, idx: number) => (
            <div key={idx}>
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-5 flex items-center justify-between text-left"
              >
                <span className={`text-base font-medium pr-8 transition-colors ${openIndex === idx ? "text-[var(--fg)]" : "text-[var(--fg-secondary)]"}`}>
                  {faq.question}
                </span>
                {openIndex === idx
                  ? <Minus className="w-4 h-4 text-[var(--fg-tertiary)] shrink-0" />
                  : <Plus className="w-4 h-4 text-[var(--fg-tertiary)] shrink-0" />
                }
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="pb-5 text-[var(--fg-secondary)] leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
