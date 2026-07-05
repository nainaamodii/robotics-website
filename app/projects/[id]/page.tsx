"use client"

import { useState, useEffect, use } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer" // Assuming you have a footer component
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import {
  Github, ExternalLink, Users, Code, Zap,
  Loader2, ArrowLeft, Calendar, Share2, Terminal,
  Cpu, Shield,
  FileText
} from "lucide-react"
import Link from "next/link"

interface Project {
  _id: string
  title: string
  description: string
  shortDescription?: string
  category: string
  image: string
  hardwareUsed: string[]
  softwareUsed: string[]
  techStack: string[]
  contributors: { name: string; role: string }[]
  mentors: { name: string; role: string }[]
  content: string
  achievements: string[]
  links: { github?: string; documentation?: string; demo?: string }
  createdAt?: string
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`)
        if (!res.ok) throw new Error("Project not found")
        const data = await res.json()
        setProject(data)
      } catch (error) {
        console.error("Failed to load project", error)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <Loader2 className="w-12 h-12 text-[#00D4FF] animate-spin mb-4" />
        <p className="font-mono text-[#00D4FF] text-sm tracking-widest animate-pulse">
          ACCESSING_MAINFRAME...
        </p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-950 relative">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 text-center relative z-10">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Data Not Found</h1>
          <p className="text-neutral-400 mb-8 font-mono">The requested project sector does not exist.</p>
          <Link href="/projects" className="px-8 py-3 bg-[#E55B5B] text-white font-bold uppercase tracking-widest hover:bg-[#E55B5B]/80 transition-colors clip-path-button" style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}>
            Return to Base
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-[#E55B5B]/30 selection:text-white">
      <Navbar />

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden border-b border-white/10">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-neutral-900 animate-pulse" /> {/* Fallback */}
          {project.image && (
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover opacity-60 scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-neutral-950/50" />

          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full h-full flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb / Back Link */}
            <Link href="/projects" className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-white transition-colors mb-6 group font-mono text-xs uppercase tracking-widest">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              // Archives / Project_View
            </Link>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-3 py-1 bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-xs font-bold uppercase tracking-wider rounded-sm">
                {project.category}
              </span>
              {project.createdAt && (
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono flex items-center gap-2 rounded-sm">
                  <Calendar size={12} /> {new Date(project.createdAt).getFullYear()}
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter max-w-4xl leading-[0.9]">
              {project.title}
            </h1>

            <p className="text-xl text-neutral-300 max-w-2xl font-light leading-relaxed border-l-2 border-[#E55B5B] pl-6 mb-8">
              {project.shortDescription || project.description.slice(0, 150) + "..."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-12">

            {/* Documentation Viewer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              {/* Decorative Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[#E55B5B] font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={16} /> Mission Report
                </span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              {/* Markdown Content */}
              <div className="prose prose-invert prose-lg max-w-none">
                <style>{`
                  .prose h1, .prose h2, .prose h3 { color: white; font-weight: 800; letter-spacing: -0.02em; }
                  .prose h1 { font-size: 2.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; }
                  .prose h2 { font-size: 1.75rem; margin-top: 3rem; color: #00D4FF; display: flex; align-items: center; gap: 0.5rem; }
                  .prose h2::before { content: '#'; color: #00D4FF; opacity: 0.5; font-family: monospace; }
                  .prose p { color: #d4d4d4; line-height: 1.8; margin-bottom: 1.5rem; }
                  .prose strong { color: white; font-weight: 700; }
                  .prose ul { list-style-type: none; padding-left: 0; }
                  .prose li { padding-left: 1.5rem; position: relative; margin-bottom: 0.5rem; color: #a3a3a3; }
                  .prose li::before { content: ''; position: absolute; left: 0; top: 0.6em; width: 6px; height: 6px; background: #E55B5B; transform: rotate(45deg); }
                  .prose code { background: rgba(255,255,255,0.1); color: #E55B5B; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
                  .prose blockquote { border-left-color: #E55B5B; background: rgba(229, 91, 91, 0.05); padding: 1rem; font-style: normal; color: white; }
                `}</style>
                <ReactMarkdown>{project.content || project.description}</ReactMarkdown>
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8">

            {/* 1. LINKS MODULE */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-6 relative overflow-hidden group"
              style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#00D4FF]/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500" />

              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="text-[#00D4FF]" size={20} /> Access Uplinks
              </h3>

              <div className="space-y-3">
                {project.links?.github && (
                  <a href={project.links.github} target="_blank" className="flex items-center gap-3 p-4 bg-black/40 hover:bg-[#00D4FF]/10 border border-white/5 hover:border-[#00D4FF]/50 transition-all group/link">
                    <Github size={20} className="text-neutral-400 group-hover/link:text-white transition-colors" />
                    <span className="font-mono text-sm text-neutral-300 group-hover/link:text-[#00D4FF]">SOURCE_CODE</span>
                    <ExternalLink size={14} className="ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity text-[#00D4FF]" />
                  </a>
                )}
                {project.links?.demo && (
                  <a href={project.links.demo} target="_blank" className="flex items-center gap-3 p-4 bg-black/40 hover:bg-[#E55B5B]/10 border border-white/5 hover:border-[#E55B5B]/50 transition-all group/link">
                    <Zap size={20} className="text-neutral-400 group-hover/link:text-white transition-colors" />
                    <span className="font-mono text-sm text-neutral-300 group-hover/link:text-[#E55B5B]">LIVE_PREVIEW</span>
                    <ExternalLink size={14} className="ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity text-[#E55B5B]" />
                  </a>
                )}
                {project.links?.documentation && (
                  <a href={project.links.documentation} target="_blank" className="flex items-center gap-3 p-4 bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/30 transition-all group/link">
                    <FileText size={20} className="text-neutral-400 group-hover/link:text-white transition-colors" />
                    <span className="font-mono text-sm text-neutral-300 group-hover/link:text-white">DOCS_V1.0</span>
                    <ExternalLink size={14} className="ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                )}

                {!project.links?.github && !project.links?.demo && (
                  <div className="p-4 text-center border border-dashed border-white/10 text-neutral-600 font-mono text-xs">
                    NO UPLINKS ESTABLISHED
                  </div>
                )}
              </div>
            </motion.div>

            {/* 2. TECH STACK MODULE */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-6 relative overflow-hidden"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Cpu className="text-[#E55B5B]" size={20} /> System Architecture
              </h3>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-mono text-neutral-500 uppercase mb-3">Core Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack?.length > 0 ? project.techStack.map(t => (
                      <span key={t} className="px-3 py-1 bg-[#E55B5B]/10 text-[#E55B5B] text-xs font-bold border border-[#E55B5B]/20 rounded-sm">
                        {t}
                      </span>
                    )) : <span className="text-neutral-600 text-xs italic">Data unavailable</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-mono text-neutral-500 uppercase mb-3">Hardware Manifest</p>
                  <div className="flex flex-wrap gap-2">
                    {project.hardwareUsed?.length > 0 ? project.hardwareUsed.map(t => (
                      <span key={t} className="px-3 py-1 bg-white/5 text-neutral-300 text-xs border border-white/10 rounded-sm">
                        {t}
                      </span>
                    )) : <span className="text-neutral-600 text-xs italic">None listed</span>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. TEAM MODULE */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Users className="text-yellow-500" size={20} /> Operatives
              </h3>

              <div className="space-y-4">
                {project.contributors?.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-black/20 rounded border border-white/5">
                    <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-neutral-400">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{c.name}</p>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase mt-1">{c.role}</p>
                    </div>
                  </div>
                ))}

                {project.mentors?.length > 0 && (
                  <>
                    <div className="h-[1px] bg-white/5 my-4" />
                    <p className="text-xs font-mono text-neutral-500 uppercase mb-3">Supervisors</p>
                    {project.mentors.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 opacity-75">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        <p className="text-sm text-neutral-300">
                          {m.name} <span className="text-neutral-600 text-xs">({m.role})</span>
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}