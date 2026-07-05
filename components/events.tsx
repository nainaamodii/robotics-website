"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"

const competitions = ["Line Follower", "Robo Wars", "Tug of War (Gesture Bot)", "AI/ML Challenges", "Image Processing"]

export default function Events() {
  return (
    <section className="py-20 px-4 bg-neutral-900">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              Robomania <span className="text-[#E55B5B]">'25</span>
            </h2>
            <p className="text-lg text-neutral-400 leading-relaxed">
              Our flagship event testing the limits of hardware and software engineering. Join us as we showcase
              innovation, creativity, and technical excellence across multiple domains.
            </p>
            <button className="px-8 py-3 bg-[#E55B5B] text-white rounded-lg font-semibold hover:bg-[#E55B5B]/90 transition-all glow-soft-red border-t border-white/10 border-b border-black/40 shadow-lg">
              Register for Events
            </button>
          </motion.div>

          {/* Right Content - Competitions List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-6">Competitions</h3>
            {competitions.map((comp, idx) => (
              <div
                key={comp}
                className="flex items-center gap-4 p-4 soft-pop-card hover:border-[#00D4FF]/50 transition-colors"
              >
                <Zap className="w-5 h-5 text-[#00D4FF] flex-shrink-0" />
                <span className="text-neutral-100">{comp}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
