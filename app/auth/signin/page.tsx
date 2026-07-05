'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Lock, ChevronRight, AlertCircle } from 'lucide-react'

// Reusing the Custom "Chamfered" Input Component for consistency
const TechInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative group">
    {/* Decorative corner accents */}
    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/30 group-focus-within:border-[#E55B5B] transition-colors pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/30 group-focus-within:border-[#E55B5B] transition-colors pointer-events-none" />

    <input
      {...props}
      className="w-full bg-black/40 border-b border-white/10 text-neutral-200 px-4 py-3 focus:outline-none focus:border-[#E55B5B] focus:bg-black/60 transition-all font-mono placeholder:text-neutral-600 tracking-wider"
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)" }}
    />
  </div>
)

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(formData.email, formData.password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 relative overflow-hidden">

      {/* --- BACKGROUND: Cyber Security Grid --- */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#E55B5B 1px, transparent 1px), linear-gradient(90deg, #E55B5B 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

      {/* --- MAIN CARD --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "circOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Tech Frame with Clip Path */}
        <div
          className="relative bg-neutral-900/90 backdrop-blur-xl border border-[#E55B5B]/20 overflow-hidden"
          style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
        >

          <div className="p-8 bg-black/20">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E55B5B]/10 border border-[#E55B5B]/20 mb-4 animate-pulse">
                <Lock className="w-5 h-5 text-[#E55B5B]" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
                Access <span className="text-[#E55B5B]">Control</span>
              </h1>
              <p className="text-xs font-mono text-neutral-500 mt-2 tracking-wide">
                AUTHENTICATION REQUIRED // MNNIT ROBOTICS
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-3 bg-red-500/10 border-l-2 border-red-500 text-red-400 text-xs font-mono flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-[#E55B5B] uppercase tracking-widest mb-2 pl-1">
                    User_ID (Email)
                  </label>
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

                <div>
                  <label className="block text-xs font-mono text-[#E55B5B] uppercase tracking-widest mb-2 pl-1">
                    Passcode
                  </label>
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
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#E55B5B] hover:bg-[#E55B5B]/90 text-white font-bold uppercase tracking-widest relative overflow-hidden group rounded-none"
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? 'Verifying...' : 'Establish Connection'}
                  {!isLoading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
                {/* Scanline Effect on Button */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </Button>
            </form>

            <div className="mt-10 text-center border-t border-white/5 pt-6">
              <p className="text-neutral-500 text-sm">
                New Terminal?{' '}
                <Link href="/auth/signup" className="text-[#E55B5B] hover:text-white transition-colors font-mono uppercase text-xs tracking-wider">
                  [ Initialize Protocol ]
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}