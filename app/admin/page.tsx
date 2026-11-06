"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { ProjectForm } from "@/components/admin/project-form"
import { ProjectsList } from "@/components/admin/projects-list"
import { MediaUploader } from "@/components/admin/media-uploader"
import { EventsManager } from "@/components/admin/events-manager"
import { ChatPanel } from "@/components/admin/agent/ChatPanel"
import { motion } from "framer-motion"
import { Plus, ImageIcon, Users, Calendar, MessageCircle } from "lucide-react"
import Link from "next/link"

type AdminTab = "list" | "add" | "media" | "events" | "chat"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("list")
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/verify", { credentials: "include" })
      if (!response.ok) { router.push("/admin/auth"); return }
      setIsAuthorized(true)
    } catch (error) { router.push("/admin/auth") }
    finally { setIsLoading(false) }
  }

  if (isLoading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg-tertiary)]">Checking access...</div>
  if (!isAuthorized) return null

  const handleProjectAdded = () => {
    setRefreshKey((prev) => prev + 1)
    setActiveTab("list")
  }

  const tabs: { key: AdminTab; label: string; icon?: React.ReactNode }[] = [
    { key: "list", label: "All Projects" },
    { key: "add", label: "Add Project", icon: <Plus size={16} /> },
    { key: "events", label: "Events", icon: <Calendar size={16} /> },
    { key: "media", label: "Media", icon: <ImageIcon size={16} /> },
    { key: "chat", label: "Chat", icon: <MessageCircle size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-4xl font-bold text-[var(--fg)] tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-[var(--fg-secondary)]">Manage projects, events, and media</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}

          <Link href="/admin/participations" className="px-5 py-2.5 rounded-full text-sm font-medium bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all flex items-center gap-2">
            <Users size={16} /> Participations
          </Link>
        </div>

        {activeTab === "list" && <ProjectsList key={refreshKey} onProjectDeleted={() => setRefreshKey(k => k + 1)} />}
        {activeTab === "add" && <ProjectForm onSuccess={handleProjectAdded} />}
        {activeTab === "events" && <EventsManager />}
        {activeTab === "media" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-[var(--fg)] mb-2">Media Library</h2>
              <p className="text-[var(--fg-secondary)]">Upload images for projects and events.</p>
            </div>
            <MediaUploader />
          </motion.div>
        )}
        {activeTab === "chat" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ChatPanel />
          </motion.div>
        )}
      </div>
    </div>
  )
}
