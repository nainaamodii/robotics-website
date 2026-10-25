"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "Frequently asked questions",
  items: [
    { question: "Do I need prior coding experience?", answer: "Not at all. We welcome students from all skill levels. Our onboarding program covers everything from basic electronics to ROS 2 — you'll be contributing to real projects within weeks. Many of our strongest members started with zero robotics experience." },
    { question: "Does the club provide components?", answer: "Yes. The club maintains a well-stocked inventory of microcontrollers, sensors, motors, 3D-printed parts, and development boards. For competition projects, we provide all materials. Members can also request components for personal projects through our resource allocation system." },
    { question: "Can students from any branch join?", answer: "Absolutely. Robotics is inherently multidisciplinary — we need mechanical engineers for chassis design, CS students for software, ECE for circuits, and even civil/chemical engineers have contributed to specialized projects. Every branch brings a unique perspective." },
    { question: "How do I participate in competitions?", answer: "Sign up on this website and join any active competition from the Events page. Teams are formed based on interest and skill mix. We hold internal selection rounds for national-level competitions like Robocon, and run workshops to prepare participants." },
    { question: "What is the time commitment?", answer: "Most members spend 6-8 hours per week on club activities — a mix of workshops, build sessions, and independent project work. During competition season the pace picks up, but we're flexible with academic schedules." },
    { question: "How is the club structured?", answer: "We have five technical verticals — Software, Electronics, Mechanical, Computer Vision, and CAD & Fabrication — each led by a team lead. The club is coordinated by a President, Vice President, and Technical Head, with guidance from two faculty advisors." },
  ],
}

const ease: [number, number, number, number] = [0.32, 0.72, 0, 1]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { content } = useSiteContent("faq", defaults)
  const data = content ?? defaults

  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          viewport={{ once: true }}
          className="font-display uppercase text-[clamp(3rem,8vw,5rem)] text-[var(--fg)] tracking-tight leading-[0.9] mb-14"
        >
          {data.heading}
        </motion.h2>

        <div>
          {(data.items ?? []).map((faq: any, idx: number) => (
            <div key={idx} className="border-b border-[var(--border)]">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-6 flex items-center justify-between text-left group"
              >
                <span className={`font-sans text-base font-medium pr-8 transition-colors ${openIndex === idx ? "text-[var(--fg)]" : "text-[var(--fg-secondary)]"}`}>
                  {faq.question}
                </span>
                <span className="shrink-0 text-[var(--fg-tertiary)]">
                  {openIndex === idx
                    ? <Minus className="w-4 h-4" />
                    : <Plus className="w-4 h-4" />
                  }
                </span>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease }}
                  >
                    <p className="pb-6 font-sans text-sm text-[var(--fg-secondary)] leading-relaxed font-medium">{faq.answer}</p>
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
