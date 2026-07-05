"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import { Lock } from "lucide-react"

export default function AdminAuthPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Invalid password")
      }

      router.push("/admin")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-neutral-900/50 border border-white/10 rounded-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-[#E55B5B]/20 rounded-lg">
                <Lock className="w-6 h-6 text-[#E55B5B]" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Admin Access</h1>
            <p className="text-neutral-400 text-center mb-6">Enter the admin password to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D4FF] transition-colors"
                />
              </div>

              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full px-4 py-2 bg-[#E55B5B] text-white rounded-lg hover:bg-[#E55B5B]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? "Verifying..." : "Unlock Dashboard"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
