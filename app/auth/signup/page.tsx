'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Terminal, UserPlus, Fingerprint, AlertTriangle } from 'lucide-react'

// Custom "Chamfered" Input Component for that sharp tech look
const TechInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative group">
    {/* Decorative corner accents */}
    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/30 group-focus-within:border-[#00D4FF] transition-colors pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/30 group-focus-within:border-[#00D4FF] transition-colors pointer-events-none" />

    <input
      {...props}
      className="w-full bg-black/40 border-b border-white/10 text-neutral-200 px-4 py-3 focus:outline-none focus:border-[#00D4FF] focus:bg-black/60 transition-all font-mono placeholder:text-neutral-600"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)" }}
    />
  </div>
)

const departments = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Engineering and Computational Mechanics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotech Engineering",
  "Production and Industrial Engineering",
  "Chemical Engineering",
  "Materials Engineering",
  "Other"
]

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNo: '',
    department: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Encryption keys (passwords) do not match')
      return
    }

    setIsLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.name, formData.rollNo, formData.department)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-8 relative">

      {/* --- BACKGROUND: Blueprint Grid --- */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="relative bg-neutral-900/90 backdrop-blur-xl border border-[#00D4FF]/20" style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}>

          {/* Top Decorative Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />

          <div className="p-8 md:p-10">

            {/* Header Section */}
            <div className="flex items-start justify-between mb-8 border-b border-white/5 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-[#00D4FF]" />
                  INIT <span className="text-[#00D4FF]">PROFILE</span>
                </h1>
                <p className="text-neutral-400 text-sm mt-2 font-mono">
                  Join the MNNIT Robotics network.
                </p>
              </div>
              <Fingerprint className="w-12 h-12 text-[#00D4FF]/10 hidden md:block" />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border-l-2 border-red-500 text-red-400 text-sm flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Personal Info Group */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00D4FF]"></span> Cadet Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2 uppercase">Full Designation</label>
                    <TechInput
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="JOHN DOE"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2 uppercase">Comm Link (Email)</label>
                    <TechInput
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="user@mnnit.ac.in"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info Group */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00D4FF]"></span> Academic Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2 uppercase">ID Number</label>
                    <TechInput
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleChange}
                      placeholder="2024XXX"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2 uppercase">Division</label>
                    <div className="relative group">
                      {/* Decorative corners for select */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/30 group-focus-within:border-[#00D4FF] transition-colors pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/30 group-focus-within:border-[#00D4FF] transition-colors pointer-events-none" />

                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-full bg-black/40 border-b border-white/10 text-neutral-200 px-4 py-3 focus:outline-none focus:border-[#00D4FF] focus:bg-black/60 transition-all font-mono appearance-none"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)" }}
                      >
                        <option value="" className="bg-neutral-900 text-neutral-500">SELECT DEPARTMENT</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept} className="bg-neutral-900 text-white">
                            {dept.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-xs">▼</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Group */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#00D4FF]"></span> Security Protocols
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2 uppercase">Passcode</label>
                    <TechInput
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2 uppercase">Confirm Passcode</label>
                    <TechInput
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold h-14 text-base relative overflow-hidden group tracking-widest uppercase rounded-none"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isLoading ? 'PROCESSING...' : 'INITIALIZE ACCOUNT'}
                    {!isLoading && <UserPlus className="w-5 h-5" />}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-neutral-500 text-sm">
              Already operational?{' '}
              <Link href="/auth/signin" className="text-[#00D4FF] hover:text-white hover:underline transition-colors font-mono uppercase tracking-wide">
                System Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}