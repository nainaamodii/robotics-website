"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useSiteContent } from "@/lib/use-site-content"

const defaults = {
  heading: "Technology",
  headingAccent: "stack",
  technologies: [
    { name: "AI / ML", icon: "🧠", description: "Lorem ipsum dolor sit amet consectetur.", span: "col-span-2 row-span-2", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800" },
    { name: "Aerial Robots", icon: "🚁", description: "Sed do eiusmod tempor incididunt.", span: "col-span-2 row-span-1", image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800" },
    { name: "ROS", icon: "🤖", description: "Ut enim ad minim veniam.", span: "col-span-1 row-span-1", image: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?auto=format&fit=crop&q=80&w=400" },
    { name: "Computer Vision", icon: "📸", description: "Quis nostrud exercitation ullamco.", span: "col-span-1 row-span-1", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400" },
    { name: "Underwater", icon: "🌊", description: "Duis aute irure dolor reprehenderit.", span: "col-span-2 row-span-2", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800" },
    { name: "SLAM", icon: "🗺️", description: "Excepteur sint occaecat cupidatat.", span: "col-span-2 row-span-1", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" },
    { name: "Electronics", icon: "⚡", description: "Nemo enim ipsam voluptatem.", span: "col-span-1 row-span-1", image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=400" },
    { name: "CAD & 3D Print", icon: "🖨️", description: "Neque porro quisquam est.", span: "col-span-1 row-span-1", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400" },
  ],
}

export default function TechStack() {
  const { content } = useSiteContent("tech-stack", defaults)
  const data = content ?? defaults

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-5xl font-bold text-[var(--fg)] tracking-tight mb-12"
        >
          {data.heading} <span className="text-[var(--accent)]">{data.headingAccent}</span>
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[160px]">
          {(data.technologies ?? []).map((tech: any, idx: number) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              viewport={{ once: true }}
              className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-all cursor-pointer ${tech.span}`}
            >
              <div className="absolute inset-0">
                <Image src={tech.image} alt={tech.name} fill sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-end p-4">
                <span className="text-lg mb-0.5">{tech.icon}</span>
                <h3 className="text-sm font-semibold text-white">{tech.name}</h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">{tech.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
