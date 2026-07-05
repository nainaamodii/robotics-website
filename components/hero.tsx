"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function Hero() {
  const { scrollY } = useScroll()
  const { user } = useAuth()

  // Opacity fades slower to keep hero visible longer during scroll
  const opacity = useTransform(scrollY, [0, 700], [1, 0.2])

  // Subtle parallax for the text
  const yText = useTransform(scrollY, [0, 500], [0, 100])

  // Determine button destination based on auth state
  const buttonDestination = user ? "/events" : "/auth/signin"

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-neutral-950">

      {/* --- BACKGROUND LAYERS --- */}

      {/* 1. The Perspective Grid (Floor) - Made bolder */}
      <div className="absolute inset-0 perspective-[1000px] pointer-events-none">
        <motion.div
          animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-40" // Increased opacity from 20 to 40
          style={{
            // Lightened the grid lines from #333 to #444 for better visibility
            backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            transform: "rotateX(60deg) scale(2.5)",
            transformOrigin: "top center",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, transparent 80%)"
          }}
        />
      </div>

      {/* 2. Central Reactor Glow (Ambient) - Increased intensity */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E55B5B]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 3. Scanning Laser Line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent shadow-[0_0_20px_rgba(0,212,255,0.6)] opacity-70"
        />
      </div>


      {/* --- HERO CONTENT --- */}
      <motion.div
        style={{ y: yText, opacity }}
        className="max-w-5xl mx-auto text-center relative z-10 px-4 mt-[-10vh]"
      >

        {/* Animated Rings (Behind Text) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10">
          <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] border border-white/10 rounded-full" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[450px] md:h-[450px] border border-dashed border-[#00D4FF]/20 rounded-full"
          />
        </div>

        {/* 1. Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[#00D4FF]/30 bg-[#00D4FF]/10 backdrop-blur-sm mb-8"
        >
          <span className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-pulse" />
          <span className="text-[#00D4FF] text-xs font-mono tracking-[0.25em] uppercase">
            IDEATE. INNOVATE. AUTOMATE.
          </span>
        </motion.div>

        {/* 2. Main Heading - Increased Size */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-black leading-tight tracking-tighter text-white mb-6"
        >
          Forging the Future, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500">
            One Bot at a Time
          </span>
        </motion.h1>

        {/* 3. Subheading - Decreased Size */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm md:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-12 font-mono"
        >
          The official Robotics Club of MNNIT. We bridge the gap between imagination and engineering, fostering a community of creators, makers, and innovators.
        </motion.p>

        {/* 4. CTA Button - Logic Added */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <Link href={buttonDestination}>
            <button className="relative group px-10 py-4 bg-transparent overflow-hidden">
              {/* Button Background & Shape */}
              <div
                className="absolute inset-0 border border-[#E55B5B] bg-[#E55B5B]/5 transition-all duration-300 group-hover:bg-[#E55B5B] group-hover:scale-[1.02]"
                style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
              />

              {/* Button Text */}
              <span className="relative font-mono font-bold tracking-[0.15em] text-[#E55B5B] text-sm group-hover:text-black transition-colors z-10 flex items-center gap-3">
                INITIALIZE PROTOCOL
              </span>

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-[#E55B5B] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-[#E55B5B] pointer-events-none" />
            </button>
          </Link>
        </motion.div>

      </motion.div>
    </section>
  )
}