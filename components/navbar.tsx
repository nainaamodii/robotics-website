"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { UserAvatar } from "@/components/user-avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Terminal, Plus, CornerDownRight } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "#who-are-we" },
    { name: "Projects", href: "/projects" },
    { name: "Events", href: "/events" },
  ]

  // --- Components ---

  const MenuToggle = ({ toggle, isOpen }: { toggle: () => void; isOpen: boolean }) => (
    <button onClick={toggle} className="md:hidden z-50 relative w-10 h-10 flex flex-col justify-center items-center group">
      <div className="w-6 h-6 flex flex-col justify-between items-center relative">
        <motion.span
          animate={isOpen ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
          className={`w-full h-[2px] bg-current transform origin-center transition-colors duration-300 ${isOpen ? "bg-[#E55B5B]" : "bg-neutral-300"}`}
        />
        <motion.span
          animate={isOpen ? { width: 0, opacity: 0 } : { width: "100%", opacity: 1 }}
          className="w-full h-[2px] bg-[#00D4FF]"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -10 } : { rotate: 0, y: 0 }}
          className={`w-full h-[2px] bg-current transform origin-center transition-colors duration-300 ${isOpen ? "bg-[#E55B5B]" : "bg-neutral-300"}`}
        />
      </div>
    </button>
  )

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
        ? "bg-neutral-950/90 backdrop-blur-md border-[#00D4FF]/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        : "bg-neutral-950/50 backdrop-blur-sm border-white/5"
        }`}
    >
      {/* Decorative Top Line (Laser) */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/30 to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* --- LOGO SECTION (UNCHANGED) --- */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-neutral-900 border border-white/10 rounded-lg group-hover:border-[#E55B5B]/50 transition-colors">
              <Cpu className="w-5 h-5 text-[#E55B5B] group-hover:animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-widest leading-none">
                <span className="text-[#E55B5B]">MNNIT</span>
                <span className="text-neutral-100">ROBOTICS</span>
              </span>
              <span className="text-[0.6rem] font-mono text-[#00D4FF] tracking-[0.2em] leading-none mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                EST. 2016
              </span>
            </div>
          </Link>

          {/* --- DESKTOP LINKS (FUTURISTIC / POINTY) --- */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative px-6 py-2 group overflow-hidden"
              >
                {/* 1. Background Hover Scan (Vertical Slice) */}
                <span className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                  style={{ clipPath: "polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 20%)" }}
                />

                {/* 2. Text Content */}
                <span className="relative z-10 text-sm font-mono font-medium text-neutral-400 group-hover:text-[#00D4FF] transition-colors duration-300 tracking-wider">
                  {link.name}
                </span>

                {/* 3. Tech Decor: HUD Corners */}
                <span className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-[#00D4FF] transition-colors opacity-0 group-hover:opacity-100" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-[#00D4FF] transition-colors opacity-0 group-hover:opacity-100" />

                {/* 4. Laser Bottom Line */}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
              </Link>
            ))}
          </div>

          {/* --- AUTH BUTTONS (LASER CUT STYLE) --- */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <div className="pl-6 border-l border-white/10 flex items-center gap-4">
                {/* Profile Link styled as tech readout */}
                <Link href="/profile" className="text-xs font-mono text-neutral-500 hover:text-white transition-colors flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00D4FF] animate-pulse" />
                  ID: {user.name || "USER"}
                </Link>
                <UserAvatar />
              </div>
            ) : (
              <>
                {/* Sign In: Brightened text for better visibility */}
                <Link
                  href="/auth/signin"
                  className="text-sm font-mono text-neutral-300 hover:text-white transition-colors relative group"
                >
                  <span className="relative z-10">Sign In</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#E55B5B] group-hover:w-full transition-all duration-300 ease-out" />
                </Link>

                {/* Join Us: Fixed Hitbox and Text Color */}
                <Link
                  href="/auth/signup"
                  className="relative group px-6 py-2 bg-transparent"
                  // Applying clipPath to the Link container fixes the flickering/hitbox issue
                  style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
                >
                  {/* Button Shape (Border) */}
                  <div
                    className="absolute inset-0 border border-[#E55B5B]/30 bg-[#E55B5B]/5 group-hover:border-[#E55B5B] transition-colors duration-300"
                  />

                  {/* Sliding Fill Effect */}
                  <div
                    className="absolute inset-0 bg-[#E55B5B] translate-x-[-105%] group-hover:translate-x-0 transition-transform duration-300 ease-out"
                  />

                  {/* Content: Changed base color to white for visibility */}
                  <span className="relative z-10 text-sm font-bold text-white group-hover:text-black flex items-center gap-2 transition-colors duration-300">
                    JOIN_PROT0C0L <Terminal className="w-3 h-3" />
                  </span>
                </Link>
              </>
            )}
          </div>

          <MenuToggle toggle={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        </div>
      </div>

      {/* --- MOBILE MENU (Deploy Animation) --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="md:hidden overflow-hidden border-b border-[#00D4FF]/20 bg-neutral-950/95 backdrop-blur-xl relative"
          >
            {/* Tech Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
              }}
            />

            <div className="px-4 py-8 space-y-2 relative z-10">
              {links.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center justify-between px-4 py-3 border-l-2 border-white/10 hover:border-[#00D4FF] hover:bg-white/5 transition-all duration-300"
                  >
                    <span className="text-neutral-300 group-hover:text-[#00D4FF] font-mono tracking-wider">
                      {link.name.toUpperCase()}
                    </span>
                    <Plus className="w-4 h-4 text-white/10 group-hover:text-[#00D4FF] opacity-0 group-hover:opacity-100 transition-all" />
                  </Link>
                </motion.div>
              ))}

              <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

              {/* Mobile Auth */}
              <div className="px-2 space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-4 px-4 py-2 border border-[#00D4FF]/20 bg-[#00D4FF]/5 rounded-sm">
                      <UserAvatar />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#00D4FF] font-mono">LOGGED IN AS</span>
                        <span className="text-sm text-white">{user.name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { signOut(); setIsOpen(false); }}
                      className="w-full py-3 text-[#E55B5B] font-mono text-sm border border-[#E55B5B]/30 hover:bg-[#E55B5B]/10 transition-colors uppercase tracking-widest"
                    >
                      Disconnect System
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Link
                      href="/auth/signin"
                      onClick={() => setIsOpen(false)}
                      className="text-center py-3 text-neutral-400 font-mono hover:text-white border border-white/10 hover:border-white/30 transition-all"
                    >
                      LOGIN
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsOpen(false)}
                      className="text-center py-3 bg-[#E55B5B] text-black font-bold font-mono hover:bg-[#ff6b6b] transition-all"
                      style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                    >
                      INITIALIZE
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}