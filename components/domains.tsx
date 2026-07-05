"use client"

import { motion } from "framer-motion"
import { Settings, Cpu, Code } from "lucide-react"

const domains = [
  {
    icon: Settings,
    title: "Mechanical",
    description: "Body Design, Kinematics, CAD.",
  },
  {
    icon: Cpu,
    title: "Electronics",
    description: "Embedded Systems, PCB Design, Circuit Manufacturing.",
  },
  {
    icon: Code,
    title: "Software",
    description: "ROS, Computer Vision, AI/ML, Path Planning.",
  },
]

export default function Domains() {
  return (
    <section className="py-20 px-4 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16"
        >
          The Trinity of <span className="text-[#E55B5B]">Technology</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {domains.map((domain, idx) => {
            const Icon = domain.icon
            return (
              <motion.div
                key={domain.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                viewport={{ once: true }}
                className="soft-pop-card p-8 hover:border-[#00D4FF]/50 transition-colors group"
              >
                <Icon className="w-12 h-12 text-[#00D4FF] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">{domain.title}</h3>
                <p className="text-neutral-400">{domain.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
