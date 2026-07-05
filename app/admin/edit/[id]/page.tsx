"use client"

import { useState, useEffect, use } from "react" // Use 'use' from react
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { ProjectForm } from "@/components/admin/project-form"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // Unwrapping params using React.use()
  const { id } = use(params)

  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data)
        }
      } catch (err) {
        console.error("Error loading project:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  const handleSuccess = () => {
    router.push("/admin")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400">Loading project data...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <Link href="/admin" className="text-[#00D4FF]">Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 hover:bg-white/10 rounded-lg text-neutral-400">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-4xl font-bold">Edit <span className="text-[#E55B5B]">Project</span></h1>
        </div>
        <ProjectForm initialData={project} onSuccess={handleSuccess} />
      </section>
    </div>
  )
}