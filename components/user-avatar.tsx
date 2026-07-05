'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User, Mail, Shield, ChevronDown, Sparkles } from 'lucide-react'

export function UserAvatar() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    setIsOpen(false)
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <div className="relative z-50">
      {/* --- TRIGGER BUTTON --- */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group flex items-center gap-2 outline-none"
      >
        {/* Avatar Circle Container */}
        <div className="relative w-10 h-10 flex items-center justify-center bg-neutral-900 rounded-full">
          {/* Animated Glowing Ring */}
          <div className={`absolute inset-0 rounded-full border border-[#00D4FF]/30 group-hover:border-[#00D4FF] transition-colors duration-300 ${isOpen ? 'border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)]' : ''}`} />

          {/* Rotating Dashed Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-4px] rounded-full border border-dashed border-white/10 group-hover:border-[#00D4FF]/20"
          />

          {/* Initials */}
          <span className="font-mono font-bold text-sm text-[#00D4FF] group-hover:text-white transition-colors">
            {initials}
          </span>

          {/* Status Dot */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neutral-900 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
          </div>
        </div>

        {/* Desktop Chevron (Optional visual cue) */}
        <ChevronDown
          size={12}
          className={`hidden md:block text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00D4FF]' : ''}`}
        />
      </motion.button>

      {/* --- DROPDOWN MENU --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to handle click-outside */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
              animate={{ opacity: 1, y: 0, scale: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
              exit={{ opacity: 0, y: -10, scale: 0.95, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
              transition={{ duration: 0.2, ease: "circOut" }}
              className="absolute right-0 mt-4 w-64 bg-neutral-900/95 backdrop-blur-xl border border-[#00D4FF]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
              style={{
                clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)"
              }}
            >
              {/* Decorative Scanline Background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px)`,
                  backgroundSize: '100% 4px'
                }}
              />

              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />

              {/* User Info Header */}
              <div className="p-5 border-b border-white/5 bg-white/5 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00D4FF]/10 rounded-sm">
                    <Shield className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white text-sm truncate uppercase tracking-wide">{user.name}</p>
                    <p className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
                      // {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Links */}
              <div className="p-2 space-y-1">


                <div className="h-[1px] bg-white/5 my-2 mx-2" />

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full relative group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 hover:bg-[#E55B5B]/10 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#E55B5B] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <LogOut size={16} className="text-neutral-400 group-hover:text-[#E55B5B] transition-colors" />
                  <span className="text-sm font-medium text-neutral-300 group-hover:text-white font-mono uppercase tracking-wider">
                    TerminatE_Session
                  </span>
                </button>
              </div>

              {/* Decorative Corner */}
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#00D4FF]/50" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper Component for consistency
function DropdownItem({ href, icon: Icon, label, onClick }: { href: string, icon: any, label: string, onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 hover:bg-white/5 overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon size={16} className="text-neutral-400 group-hover:text-[#00D4FF] transition-colors" />
      <span className="text-sm font-medium text-neutral-300 group-hover:text-white font-mono uppercase tracking-wide">
        {label}
      </span>
      {/* Hover Arrow */}
      <Sparkles size={12} className="ml-auto text-[#00D4FF] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
    </Link>
  )
}