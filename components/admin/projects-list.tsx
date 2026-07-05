"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Edit2, Eye } from "lucide-react"
import Link from "next/link"

export function ProjectsList({ onProjectDeleted }: { onProjectDeleted: () => void }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null) // FIXED: Added missing state

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch projects", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (response.ok) {
        setProjects(projects.filter((p) => p._id !== id))
        onProjectDeleted()
      }
    } catch (err) {
      console.error("Delete failed", err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "togglePublished" }),
      })
      if (response.ok) {
        const updated = await response.json()
        setProjects(projects.map((p) => (p._id === id ? updated : p)))
      }
    } catch (err) {
      console.error("Toggle failed", err)
    }
  }

  if (loading) {
    return <div className="text-center text-neutral-400 py-12">Loading projects from database...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          All Projects <span className="text-neutral-400 text-lg">({projects.length})</span>
        </h2>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <p className="text-neutral-400 mb-4">No projects found in database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-400">Category</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-400">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {projects.map((project) => (
                  <motion.tr
                    key={project._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{project.title}</p>
                      <p className="text-sm text-neutral-400 truncate max-w-xs">{project.shortDescription}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#E55B5B]/20 text-[#E55B5B] text-xs rounded-full">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${project.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                        {project.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(project._id)}
                          className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 transition-colors"
                          title="Toggle Publish"
                        >
                          {project.published ? "Unpublish" : "Publish"}
                        </button>
                        <Link
                          href={`/admin/edit/${project._id}`}
                          className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(project._id)}
                          disabled={deletingId === project._id}
                          className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-[#E55B5B] transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}