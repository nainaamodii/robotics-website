"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Newspaper, Radio, Trophy, Award } from "lucide-react"

const achievements = [
  {
    title: "MNNIT students develop first self-driving car prototype",
    source: "Times of India",
    date: "Dec 2019",
    category: "Automotive",
    rank: "01"
  },
  {
    title: "Breakthrough innovation in Prosthetic Arm technology",
    source: "Dainik Bhaskar",
    date: "Aug 2021",
    category: "Biomedical",
    rank: "02"
  },
  {
    title: "Vision Guided Rover deployed for advanced surveillance",
    source: "Jagran News",
    date: "Feb 2023",
    category: "Defense",
    rank: "03"
  },
]

export default function Achievements() {
  return (
    <section className="py-24 px-4 bg-neutral-950 relative overflow-hidden">

      {/* --- BACKGROUND: Hexagonal Cyber Pattern --- */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at center, #E55B5B 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />

      {/* Moving Light Beam */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#E55B5B]/10 to-transparent rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border-l-2 border-[#E55B5B] bg-gradient-to-r from-[#E55B5B]/10 to-transparent mb-4">
              <Radio className="w-3 h-3 text-[#E55B5B] animate-pulse" />
              <span className="text-xs font-mono text-[#E55B5B] uppercase tracking-wider">Transmission Received</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
              In The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E55B5B] to-orange-500">Headlines</span>
            </h2>
          </div>

          <div className="hidden md:block text-right">
            <Trophy className="w-12 h-12 text-[#E55B5B]/20 ml-auto mb-2" />
            <p className="text-xs font-mono text-neutral-500">RECOGNITION_LOGS // ARCHIVE</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {achievements.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              viewport={{ once: true }}
              className="group relative h-full"
            >
              {/* Card Container with Clip Path */}
              <div
                className="h-full bg-neutral-900/40 backdrop-blur-md border border-white/5 p-8 flex flex-col transition-all duration-300 group-hover:bg-neutral-900/80 group-hover:border-[#E55B5B]/30 relative overflow-hidden"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)" }}
              >
                {/* Hover Flash Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E55B5B]/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1s_infinite]" />

                {/* Rank Watermark */}
                <span className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-[#E55B5B]/10 transition-colors font-mono select-none">
                  {item.rank}
                </span>

                {/* Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-[#E55B5B]">
                    <Newspaper className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wide">{item.source}</span>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-bold bg-[#E55B5B]/10 text-[#E55B5B] border border-[#E55B5B]/20 rounded-sm">
                    {item.category}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-neutral-200 mb-6 leading-relaxed group-hover:text-white transition-colors relative z-10">
                  {item.title}
                </h3>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                  <span className="text-sm text-neutral-500 font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full group-hover:bg-[#E55B5B] transition-colors" />
                    {item.date}
                  </span>
                  <div className="flex items-center gap-2 text-white text-sm font-semibold group-hover:text-[#E55B5B] transition-colors cursor-pointer">
                    Read
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </div>
              </div>

              {/* Decorative Corner underneath (visual trick for the clip-path) */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-[#E55B5B]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}