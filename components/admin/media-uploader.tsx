"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Loader2, Copy, Check, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface MediaItem {
  _id: string
  filename: string
  url: string
  cloudinaryId: string
  uploadedAt: Date
  size: number
}

interface MediaUploaderProps {
  onMediaUploaded?: (media: MediaItem) => void
}

export function MediaUploader({ onMediaUploaded }: MediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch("/api/media", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setMedia(data)
      }
    } catch (err) {
      console.error("[v0] Failed to fetch media:", err)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setLoading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        console.log("[v0] Starting upload for:", file.name, "Size:", file.size)
        
        // Client-side validation
        const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`)
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        if (!validTypes.includes(file.type)) {
          throw new Error(`File type "${file.type}" not supported. Please use JPEG, PNG, GIF, WebP, or SVG.`)
        }

        const formData = new FormData()
        formData.append("file", file)

        console.log("[v0] Sending upload request...")
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        })

        console.log("[v0] Upload response status:", response.status)

        let responseData
        try {
          responseData = await response.json()
        } catch (jsonErr) {
          console.error("[v0] Failed to parse response JSON:", jsonErr)
          const text = await response.text()
          console.error("[v0] Response text:", text.substring(0, 200))
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }

        if (!response.ok) {
          console.error("[v0] Upload error response:", responseData)
          throw new Error(responseData.error || `Upload failed with status ${response.status}`)
        }

        console.log("[v0] Upload successful:", responseData)
        setMedia((prev) => [responseData, ...prev])
        onMediaUploaded?.(responseData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed"
      console.error("[v0] Upload error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      console.log("[v0] Deleting media:", id)
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      console.log("[v0] Delete successful")
      setMedia((prev) => prev.filter((m) => m._id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed"
      console.error("[v0] Delete error:", errorMessage)
      setError(errorMessage)
    }
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-[#00D4FF]/50 transition-colors cursor-pointer bg-white/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
          <motion.div animate={loading ? { scale: 1.1 } : { scale: 1 }} transition={{ duration: 0.2 }}>
            {loading ? (
              <Loader2 size={40} className="text-[#00D4FF] animate-spin mb-3" />
            ) : (
              <Upload size={40} className="text-[#00D4FF] mb-3" />
            )}
          </motion.div>
          <h3 className="text-lg font-semibold text-white mb-1">{loading ? "Uploading..." : "Upload Images"}</h3>
          <p className="text-neutral-400 text-sm">Click to select or drag and drop (PNG, JPG, WebP)</p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#E55B5B]/20 border border-[#E55B5B]/50 rounded-lg text-[#E55B5B]"
        >
          {error}
        </motion.div>
      )}

      {/* Media Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Uploaded Media ({media.length})</h3>

        {initialLoading ? (
          <div className="text-center py-12 text-neutral-400">
            <Loader2 className="animate-spin mx-auto mb-3" />
            <p>Loading media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <p>No images uploaded yet. Start by uploading your first image.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {media.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#00D4FF]/50 transition-all group"
                >
                  {/* Image Preview */}
                  <div className="aspect-video bg-neutral-900 relative overflow-hidden">
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyToClipboard(item.url, item._id)}
                        className="p-2 bg-[#00D4FF] text-neutral-950 rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
                        title="Copy URL"
                      >
                        {copiedId === item._id ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 bg-[#E55B5B] text-white rounded-lg hover:bg-[#E55B5B]/90 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-white truncate">{item.filename}</p>
                      <p className="text-xs text-neutral-500">{formatDate(item.uploadedAt)}</p>
                    </div>

                    {/* URL Display */}
                    <div className="bg-neutral-900 rounded p-2">
                      <p className="text-xs text-neutral-400 mb-1">URL:</p>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          readOnly
                          value={item.url}
                          className="flex-1 text-xs bg-transparent text-neutral-300 outline-none truncate"
                        />
                        <button
                          onClick={() => copyToClipboard(item.url, item._id)}
                          className="text-neutral-500 hover:text-[#00D4FF] transition-colors"
                          title="Copy URL"
                        >
                          {copiedId === item._id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Markdown */}
                    <div className="bg-neutral-900 rounded p-2">
                      <p className="text-xs text-neutral-400 mb-1">Markdown:</p>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          readOnly
                          value={`![${item.filename}](${item.url})`}
                          className="flex-1 text-xs bg-transparent text-neutral-300 outline-none truncate"
                        />
                        <button
                          onClick={() => copyToClipboard(`![${item.filename}](${item.url})`, `md-${item._id}`)}
                          className="text-neutral-500 hover:text-[#00D4FF] transition-colors"
                          title="Copy Markdown"
                        >
                          {copiedId === `md-${item._id}` ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500">{formatFileSize(item.size)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
