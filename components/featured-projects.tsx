"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

const projects = [
  {
    id: "01",
    title: "Cart 95 - Self Driving",
    description: "MNNIT's flagship autonomous vehicle prototype featuring LiDAR integration and real-time path planning.",
    image: "https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&q=80&w=1200",
    tech: ["LIDAR", "Python", "ROS"],
  },
  {
    id: "02",
    title: "Self Balancing Bike",
    description: "A precision-engineered two-wheeler utilizing gyroscopic stabilization and PID control loops.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200",
    tech: ["Arduino", "PID", "Gyro"],
  },
  {
    id: "03",
    title: "Humanoid Research",
    description: "Bi-pedal robotics research focusing on dynamic balance and human-like movement patterns.",
    image: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=800",
    tech: ["Inverse Kinematics", "Servo"],
  },
  {
    id: "04",
    title: "Gagankavach",
    description: "Vision-guided surveillance rover designed for high-stakes environmental monitoring.",
    image: "https://images.unsplash.com/photo-1533619239233-6280475a634a?auto=format&fit=crop&q=80&w=800",
    tech: ["CV", "IoT", "Rover"],
  },
]

export default function FeaturedProjects() {
  return (
    <section className="py-24 bg-neutral-950 overflow-hidden relative">

      {/* --- BACKGROUND: Blueprint Grid --- */}
      <div className="absolute inset-0 w-full h-full opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* --- CENTRAL DATA PIPELINE --- */}
      {/* Mobile: Line is at left-6. Desktop: Line is at left-1/2 */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#00D4FF]/30 to-transparent z-0" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-20 pl-12 md:pl-0" // Offset header on mobile to align visually
        >
          <span className="text-[#E55B5B] font-mono text-sm tracking-widest uppercase mb-2 block">
            // Output Log
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white">
            PROJECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-blue-600">TIMELINE</span>
          </h2>
        </motion.div>

        <div className="space-y-24">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-20`}
            >

              {/* --- GLOWING RHOMBUS NODE --- */}
              {/* Mobile: left-6 (matches line). 
                  Desktop: left-1/2 (matches line). 
                  -translate-x-1/2 centers it exactly on the line. 
              */}
              <div className="absolute left-6 md:left-1/2 top-0 md:top-8 -translate-x-1/2 w-4 h-4 bg-black border border-[#00D4FF] shadow-[0_0_10px_#00D4FF] rotate-45 z-20">
                <div className="w-full h-full bg-[#00D4FF] animate-ping opacity-50" />
              </div>

              {/* --- IMAGE BLOCK --- */}
              {/* Desktop: Alternates Left/Right.
                 Mobile: Always Full Width, pushed right by padding (pl-12).
              */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${idx % 2 === 0 ? "md:order-1 md:text-right" : "md:order-2"}`}>
                <div className="group relative aspect-[16/9] bg-neutral-900 border border-white/10 overflow-hidden"
                  style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                  />
                  {/* Image Overlay UI */}
                  <div className="absolute inset-0 border border-white/5 pointer-events-none">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <div className="w-1 h-1 bg-white/50" />
                      <div className="w-1 h-1 bg-white/50" />
                      <div className="w-1 h-1 bg-[#E55B5B]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- TEXT BLOCK --- */}
              {/* Desktop: Alternates Left/Right.
                 Mobile: Always Full Width, pushed right by padding (pl-12).
              */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${idx % 2 === 0 ? "md:order-2 text-left" : "md:order-1 md:text-right"}`}>
                <div className={`flex flex-col ${idx % 2 !== 0 ? "md:items-end" : "items-start"}`}>
                  <span className="text-[#00D4FF] font-mono text-5xl md:text-8xl font-bold opacity-20 -mb-4 md:-mb-10 select-none">
                    {project.id}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 relative z-10">
                    {project.title}
                  </h3>
                  <p className="text-neutral-400 mb-6 leading-relaxed max-w-md text-sm md:text-base">
                    {project.description}
                  </p>

                  <div className={`flex flex-wrap gap-2 mb-6 ${idx % 2 !== 0 ? "md:justify-end" : "justify-start"}`}>
                    {project.tech.map(t => (
                      <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
                        {t}
                      </span>
                    ))}
                  </div>

                  <button className="flex items-center gap-2 text-[#E55B5B] hover:text-white transition-colors group uppercase text-xs md:text-sm tracking-widest font-bold">
                    System Analysis <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}