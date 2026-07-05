"use client"

import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { Lightbulb, Users, Rocket, Zap } from "lucide-react"
import { MouseEvent } from "react"

const purposes = [
  {
    icon: Users,
    title: "Unite Curious Minds",
    id: "SYS-01",
    description:
      "A convergence point for multidisciplinary engineering. We bridge the gap between theoretical curiosity and practical application.",
    accent: "text-blue-400",
    border: "group-hover:border-blue-400/50",
  },
  {
    icon: Lightbulb,
    title: "Hands-on Experience",
    id: "SYS-02",
    description:
      "Deployment of real-world scenarios. Mastering embedded systems, mechanical design, and control theory through direct fabrication.",
    accent: "text-cyan-400",
    border: "group-hover:border-cyan-400/50",
  },
  {
    icon: Rocket,
    title: "Compete & Excel",
    id: "SYS-03",
    description:
      "High-performance bot development for national arenas. Pushing the limits of torque, speed, and autonomous navigation.",
    accent: "text-red-400",
    border: "group-hover:border-red-400/50",
  },
  {
    icon: Zap,
    title: "Inspire & Educate",
    id: "SYS-04",
    description:
      "Knowledge transfer protocols. Workshops and outreach programs designed to ignite the next generation of roboticists.",
    accent: "text-amber-400",
    border: "group-hover:border-amber-400/50",
  },
]

export default function Purpose() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <section
      className="py-24 px-4 bg-neutral-950 relative overflow-hidden group"
      onMouseMove={handleMouseMove}
    >
      {/* -------------------------------------------------------------------------
        LAYER 1: Base Grid (Static)
        Changed color to Cyan/Blue (#06b6d4) instead of white.
        Reduced opacity to 0.1 for very subtle visibility.
        ------------------------------------------------------------------------- 
      */}
      <div
        className="absolute inset-0 w-full h-full opacity-[0.1] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* -------------------------------------------------------------------------
        LAYER 2: Cursor Glow (Soft Ambient Light)
        Reduced opacity (0.1) and radius (400px) for a softer spread.
        ------------------------------------------------------------------------- 
      */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: useMotionTemplate`radial-gradient(
            400px circle at ${mouseX}px ${mouseY}px,
            rgba(6, 181, 212, 0.1),
            transparent 50%
          )`,
        }}
      />

      {/* -------------------------------------------------------------------------
        LAYER 3: Illuminated Grid (Revealed by Mask)
        Matches the blue color.
        Mask radius reduced to 250px for a focused but soft spotlight.
        ------------------------------------------------------------------------- 
      */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          backgroundImage: `linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b5d4ad 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage: useMotionTemplate`radial-gradient(
            250px circle at ${mouseX}px ${mouseY}px,
            black,
            transparent
          )`,
          WebkitMaskImage: useMotionTemplate`radial-gradient(
            250px circle at ${mouseX}px ${mouseY}px,
            black,
            transparent
          )`,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-[1px] w-12 bg-neutral-700" />
            <span className="text-xs font-mono text-cyan-500 tracking-[0.2em] uppercase">
              Mission Protocols
            </span>
            <div className="h-[1px] w-12 bg-neutral-700" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Our <span className="text-[#E55B5B]">Core Purpose</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {purposes.map((purpose, idx) => {
            const Icon = purpose.icon
            return (
              <motion.div
                key={purpose.title}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                /* Added backdrop-blur-md for frosted glass effect.
                   Adjusted background opacity to ensure blur is visible but text is readable.
                */
                className={`group/card relative bg-neutral-900/60 backdrop-blur-md border border-white/5 p-8 overflow-hidden hover:bg-neutral-900/80 transition-all duration-300 ${purpose.border}`}
              >
                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-neutral-600 group-hover/card:border-white transition-colors" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-neutral-600 group-hover/card:border-white transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-neutral-600 group-hover/card:border-white transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-neutral-600 group-hover/card:border-white transition-colors" />

                {/* Animated Scanline Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent -translate-y-full group-hover/card:translate-y-full transition-transform duration-1000 ease-in-out" />

                <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                  {/* Icon Box */}
                  <div
                    className={`p-4 rounded-lg bg-neutral-950/80 border border-white/10 ${purpose.accent} group-hover/card:scale-105 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white group-hover/card:text-cyan-400 transition-colors">
                        {purpose.title}
                      </h3>
                      <span className="text-xs font-mono text-neutral-600 group-hover/card:text-cyan-500/50 transition-colors">
                        {purpose.id}
                      </span>
                    </div>

                    <p className="text-neutral-400 leading-relaxed text-sm">
                      {purpose.description}
                    </p>

                    {/* Decorative Data Line */}
                    <div className="mt-6 flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity delay-100">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${purpose.accent.replace(
                          "text-",
                          "bg-"
                        )}`}
                      />
                      <div className="h-[1px] w-full bg-neutral-800" />
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}