"use client"

import { motion } from "framer-motion"
import { Code, Cpu, Globe, Zap, Target, PenTool, Radio } from "lucide-react"

const features = [
  { label: "Computer Vision", icon: Target },
  { label: "ROS & Simulation", icon: Globe },
  { label: "Embedded Systems", icon: Cpu },
  { label: "CAD & Design", icon: PenTool },
  { label: "Machine Learning", icon: Code },
  { label: "Kinematics", icon: Zap },
]

export default function WhoAreWe() {
  return (
    <section id="who-are-we" className="py-24 px-4 bg-neutral-950 relative overflow-hidden scroll-mt-20">

      {/* --- BACKGROUND: Motherboard Depth --- */}
      {/* 1. Ambient Spotlights to kill the flat black */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#00D4FF]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#E55B5B]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 2. The "Data Stream" Line - A single horizontal runner */}
      <div className="absolute top-[15%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent opacity-50" />
      <div className="absolute top-[15%] left-[10%] w-32 h-[1px] bg-[#00D4FF]/50 blur-[2px] animate-[shimmer_5s_infinite]" />

      {/* 3. Tech Accents - Non-repetitive floating elements */}
      <div className="absolute bottom-20 left-10 w-2 h-2 bg-[#E55B5B] rounded-full opacity-50 animate-pulse" />
      <div className="absolute top-40 right-10 w-24 h-24 border-r border-t border-white/5 opacity-30 rounded-tr-3xl" />


      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Side: The Narrative (Red/Warm Tones) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#E55B5B]/10 border-l-2 border-[#E55B5B] mb-6">
                <Radio className="w-3 h-3 text-[#E55B5B] animate-pulse" />
                <span className="text-xs font-mono text-[#E55B5B] tracking-widest uppercase">Identity_Module</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                Architects of the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E55B5B] to-orange-500">
                  Future
                </span>
              </h2>
            </div>

            {/* Content Text */}
            <div className="prose prose-invert prose-lg text-neutral-400 font-light border-l border-white/5 pl-6">
              <p>
                Robotics Club MNNIT is a dynamic ecosystem of innovators operating under the <span className="text-white font-semibold">Student Activity Centre</span>.
              </p>
              <p>
                We don't just build robots; we bridge the gap between <span className="text-[#00D4FF]">software intelligence</span> and <span className="text-[#E55B5B]">hardware reality</span>. Since our inception, we have been the breeding ground for interdisciplinary engineering.
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 border-t border-white/10 pt-8">
              <div className="group cursor-default">
                <h4 className="text-3xl font-bold text-white group-hover:text-[#E55B5B] transition-colors">2016</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1 h-1 bg-neutral-500 rounded-full" />
                  <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Established</p>
                </div>
              </div>

              <div className="w-[1px] h-12 bg-white/10" />

              <div className="group cursor-default">
                <h4 className="text-3xl font-bold text-white group-hover:text-[#00D4FF] transition-colors">50+</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1 h-1 bg-neutral-500 rounded-full" />
                  <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Projects Shipped</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Tech Matrix (Blue/Cool Tones) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Chamfered Card Container - BLUE THEME */}
            <div
              className="bg-neutral-900/40 backdrop-blur-md border border-white/10 p-8 relative overflow-hidden"
              style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
            >
              {/* Scanline */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D4FF]/5 to-transparent h-[50%] animate-[scan_3s_ease-in-out_infinite]" />

              <h3 className="text-xl font-mono font-bold text-white mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                <Code className="w-5 h-5 text-[#00D4FF]" />
                CORE_COMPETENCIES
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {features.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="group flex items-center gap-3 p-4 bg-black/50 border border-white/5 hover:border-[#00D4FF]/50 transition-all duration-300"
                    style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                  >
                    <item.icon className="w-5 h-5 text-neutral-500 group-hover:text-[#00D4FF] transition-colors" />
                    <span className="text-sm font-mono text-neutral-300 group-hover:text-white">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}