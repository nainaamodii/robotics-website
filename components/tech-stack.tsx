"use client"

import { motion } from "framer-motion"
import Image from "next/image"

// Same data array as before
const technologies = [
  {
    title: "AI/ML",
    icon: "🧠",
    description: "Neural networks & autonomous decision making.",
    className: "col-span-2 md:col-span-2 md:row-span-2",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Aerial Robots",
    icon: "🚁",
    description: "Swarm intelligence and UAV flight dynamics.",
    className: "col-span-2 md:col-span-2 md:row-span-1",
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "ROS",
    icon: "🤖",
    description: "The backbone of our robotic communication.",
    className: "col-span-1 md:col-span-1 md:row-span-1",
    image: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400",
  },
  {
    title: "Image Processing",
    icon: "📸",
    description: "Computer vision for real-time tracking.",
    className: "col-span-1 md:col-span-1 md:row-span-1",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400",
  },
  {
    title: "Underwater Robots",
    icon: "🌊",
    description: "Navigating the complexities of AUVs.",
    className: "col-span-2 md:col-span-2 md:row-span-2",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Path Planning & SLAM",
    icon: "🗺️",
    description: "Localization in unknown environments.",
    className: "col-span-2 md:col-span-2 md:row-span-1",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Electronics",
    icon: "⚡",
    description: "PCB design and power management.",
    className: "col-span-1 md:col-span-1 md:row-span-1",
    image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=400",
  },
  {
    title: "3D Printing & CAD",
    icon: "🖨️",
    description: "From digital models to physical prototypes.",
    className: "col-span-1 md:col-span-1 md:row-span-1",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400",
  },
  {
    title: "Internet of Things",
    icon: "🌐",
    description: "Connecting hardware to the cloud.",
    className: "col-span-2 md:col-span-2 md:row-span-1",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Kinematics & Control",
    icon: "⚙️",
    description: "The physics of motion and precision.",
    className: "col-span-1 md:col-span-1 md:row-span-1",
    image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=400",
  },
  {
    title: "Simulation Software",
    icon: "🖥️",
    description: "Gazebo and Webots testing environments.",
    className: "col-span-1 md:col-span-1 md:row-span-1",
    image: "https://images.unsplash.com/photo-1558494949-ef010ccdcc39?auto=format&fit=crop&q=80&w=400",
  },
]

export default function TechStack() {
  return (
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden">

      {/* --- BACKGROUND: Circuit Board Pattern --- */}
      <div className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, #333 1px, transparent 1px),
            linear-gradient(0deg, transparent 49%, #333 49%, #333 51%, transparent 51%),
            linear-gradient(90deg, transparent 49%, #333 49%, #333 51%, transparent 51%)
          `,
          backgroundSize: '40px 40px, 80px 80px, 80px 80px'
        }}
      />
      {/* Animated Glow Spot */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#E55B5B]/10 blur-[120px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
              Tech <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E55B5B] to-orange-500">Arsenal</span>
            </h2>
          </motion.div>
          <div className="hidden md:flex items-center gap-2 text-[#00D4FF] font-mono text-xs">
            <div className="w-2 h-2 bg-[#00D4FF] animate-pulse" />
            DATABASE_LOADED
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-4 auto-rows-[160px] md:auto-rows-[180px]">
          {technologies.map((tech, idx) => (
            <motion.div
              key={tech.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              /* KEY CHANGE: clip-path for angled corners (chamfer)
                 KEY CHANGE: Removed heavy opacity on images, now they are clear.
              */
              className={`group relative overflow-hidden bg-neutral-900 border border-white/10 transition-all duration-300 hover:border-[#E55B5B] hover:z-10 hover:shadow-[0_0_30px_rgba(229,91,91,0.2)] ${tech.className}`}
              style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
            >
              {/* Image Layer - Clear Visibility (Opacity 0.7 -> 1) */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={tech.image}
                  alt={tech.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                {/* Gradient only at the bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
              </div>

              {/* Scanline Effect on Hover */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                style={{ background: 'linear-gradient(transparent 50%, rgba(0, 212, 255, 0.1) 50%)', backgroundSize: '100% 4px' }}
              />

              <div className="relative z-20 h-full flex flex-col justify-end p-4">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{tech.icon}</span>
                    <span className="text-[10px] font-mono text-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity">
                      ID_{idx < 10 ? `0${idx}` : idx}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-white group-hover:text-[#E55B5B] transition-colors leading-tight">
                    {tech.title}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {tech.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}