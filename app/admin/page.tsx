"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { ProjectForm } from "@/components/admin/project-form"
import { ProjectsList } from "@/components/admin/projects-list"
import { MediaUploader } from "@/components/admin/media-uploader"
import { EventsManager } from "@/components/admin/events-manager" // Import new component
import { motion } from "framer-motion"
import { Plus, ImageIcon, Users, Calendar } from "lucide-react" // Import Calendar icon
import Link from "next/link"

// Add 'events' to type
type AdminTab = "list" | "add" | "media" | "events"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("list")
  const [refreshKey, setRefreshKey] = useState(0)
  // ... existing state ...
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    // ... existing auth check logic ...
    try {
      const response = await fetch("/api/admin/verify", { credentials: "include" })
      if (!response.ok) { router.push("/admin/auth"); return }
      setIsAuthorized(true)
    } catch (error) { router.push("/admin/auth") }
    finally { setIsLoading(false) }
  }

  if (isLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">Checking access...</div>
  if (!isAuthorized) return null

  const handleProjectAdded = () => {
    setRefreshKey((prev) => prev + 1)
    setActiveTab("list")
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      {/* Header */}
      <section className="border-b border-white/5 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 className="text-4xl font-bold">
              Admin <span className="text-[#E55B5B]">Dashboard</span>
            </h1>
            <p className="text-neutral-400 mt-2">Manage robotics club projects, events, and media</p>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="border-b border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "list" ? "border-[#E55B5B] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "add" ? "border-[#E55B5B] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
          >
            <Plus size={18} /> Add Project
          </button>

          {/* New Events Tab */}
          <button
            onClick={() => setActiveTab("events")}
            className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "events" ? "border-[#E55B5B] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
          >
            <Calendar size={18} /> Manage Events
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`px-6 py-4 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "media" ? "border-[#E55B5B] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}
          >
            <ImageIcon size={18} /> Media Library
          </button>

          <Link href="/admin/participations">
            <button className="px-6 py-4 font-medium border-b-2 border-transparent text-neutral-400 hover:text-white flex items-center gap-2 transition-colors whitespace-nowrap">
              <Users size={18} /> View Participations
            </button>
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "list" && <ProjectsList key={refreshKey} onProjectDeleted={() => setRefreshKey(k => k + 1)} />}
          {activeTab === "add" && <ProjectForm onSuccess={handleProjectAdded} />}
          {activeTab === "events" && <EventsManager />}
          {activeTab === "media" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Media Library</h2>
                <p className="text-neutral-400">Upload images for projects and events.</p>
              </div>
              <MediaUploader />
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}