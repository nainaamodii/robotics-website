"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { UserAvatar } from "@/components/user-avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useSiteContent } from "@/lib/use-site-content"
import ThemeToggle from "./theme-toggle"

const defaultNav = {
  logo: { text: "MNNIT Robotics" },
  links: [
    { name: "Projects", href: "/projects" },
    { name: "Events", href: "/events" },
    { name: "SDC", href: "/sdc" },
    { name: "Team", href: "/team" },
  ],
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const { content } = useSiteContent("navbar", defaultNav)
  const nav = content ?? defaultNav

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className="sticky top-0 z-50 px-4 pt-3">
      <div
        className={`max-w-6xl mx-auto rounded-full transition-all duration-500 ${
          scrolled
            ? "bg-[var(--bg)]/90 backdrop-blur-2xl border border-[var(--border)]"
            : "bg-[var(--bg)]/60 backdrop-blur-xl border border-[var(--border)]/50"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/favicon.png"
              alt="Robotics Club Logo"
              width={32}
              height={32}
              className="dark:invert"
            />
            <span className="font-display text-lg tracking-tight text-[var(--fg)]">
              {nav.logo?.text || "MNNIT Robotics"}
            </span>
          </Link>

          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-1 rounded-full bg-[var(--bg-secondary)]/80 px-1.5 py-1">
              {(nav.links ?? []).map((link: any) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-4 py-1.5 rounded-full text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-all"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/teams" className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">
                  My Teams
                </Link>
                <Link href="/profile" className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">
                  {user.name || "Profile"}
                </Link>
                <UserAvatar />
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-5 py-2 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 flex flex-col justify-center items-center gap-1.5"
              aria-label="Menu"
            >
              <span className={`w-5 h-[1.5px] bg-[var(--fg)] transition-all duration-300 ${isOpen ? "rotate-45 translate-y-[4px]" : ""}`} />
              <span className={`w-5 h-[1.5px] bg-[var(--fg)] transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-[3px]" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-2 rounded-2xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden"
          >
            <div className="px-5 py-4 space-y-1">
              {(nav.links ?? []).map((link: any) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-2.5 text-[var(--fg-secondary)] hover:text-[var(--fg)] text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-[var(--border)] my-3" />
              {user ? (
                <>
                  <Link href="/teams" onClick={() => setIsOpen(false)} className="block py-2.5 text-[var(--fg-secondary)] hover:text-[var(--fg)] text-sm transition-colors">My Teams</Link>
                  <Link href="/profile" onClick={() => setIsOpen(false)} className="block py-2.5 text-[var(--fg-secondary)] hover:text-[var(--fg)] text-sm transition-colors">Profile</Link>
                  <button
                    onClick={() => { signOut(); setIsOpen(false) }}
                    className="block py-2 text-[var(--fg-secondary)] text-sm"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium inline-block"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
