"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Terminal, Cpu, HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "Do I need prior coding experience?",
    answer: "Negative. Our initialization protocols are designed for beginners. We provide the necessary knowledge base to get you operational.",
    id: "SYS_Q_01"
  },
  {
    question: "Does the club provide components?",
    answer: "Affirmative. We allocate hardware resources for all sanctioned club projects and R&D initiatives.",
    id: "SYS_Q_02"
  },
  {
    question: "Can students from any branch join?",
    answer: "Confirmed. Robotics is an interdisciplinary field. We require diverse skill sets including mechanical, electrical, and logic synthesis.",
    id: "SYS_Q_03"
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 px-4 bg-neutral-950 overflow-hidden relative border-t border-white/5">

      {/* --- BACKGROUND: Digital Static & Grid --- */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, #222 25%, #222 26%, transparent 27%, transparent 74%, #222 75%, #222 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #222 25%, #222 26%, transparent 27%, transparent 74%, #222 75%, #222 76%, transparent 77%, transparent)`,
            backgroundSize: '30px 30px'
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-neutral-900 border border-[#00D4FF]/30 rounded-full mb-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse" />
            <Terminal className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-xs font-mono text-[#00D4FF] relative z-10 tracking-widest">SYSTEM_DIAGNOSTICS</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Common <span className="text-neutral-600">Queries</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`group border transition-all duration-300 relative overflow-hidden ${openIndex === idx
                  ? "bg-neutral-900/80 border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                  : "bg-neutral-900/30 border-white/10 hover:border-[#00D4FF]/50"
                }`}
            >
              {/* Active Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${openIndex === idx ? "bg-[#00D4FF]" : "bg-transparent"}`} />

              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-6 flex items-center justify-between text-left relative z-10"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <span className={`font-mono text-xs md:text-sm transition-colors duration-300 ${openIndex === idx ? "text-[#00D4FF]" : "text-neutral-600 group-hover:text-[#00D4FF]/50"}`}>
                    [{faq.id}]
                  </span>
                  <span className={`text-base md:text-lg font-medium transition-colors ${openIndex === idx ? "text-white" : "text-neutral-300 group-hover:text-white"}`}>
                    {faq.question}
                  </span>
                </div>
                <div className={`p-1 rounded border transition-all duration-300 ${openIndex === idx ? "border-[#00D4FF] bg-[#00D4FF]/10" : "border-white/10 bg-neutral-800"}`}>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-300 ${openIndex === idx ? "rotate-90 text-[#00D4FF]" : "text-neutral-400"}`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                  >
                    <div className="px-6 pb-6 pt-2 pl-12 md:pl-16">
                      <div className="relative pl-6 border-l border-[#00D4FF]/20">
                        {/* Blinking Cursor Decoration */}
                        <div className="absolute -left-[5px] top-0 w-2 h-2 bg-[#00D4FF] rounded-full" />

                        <p className="text-neutral-400 leading-relaxed font-mono text-sm md:text-base">
                          <span className="text-[#00D4FF] mr-2 opacity-50">{`>>`}</span>
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}