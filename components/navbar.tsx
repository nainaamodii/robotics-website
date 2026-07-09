"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { UserAvatar } from "@/components/user-avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useSiteContent } from "@/lib/use-site-content"
import ThemeToggle from "./theme-toggle"

const defaultNav = {
  logo: { text: "MNNIT Robotics" },
  links: [
    { name: "About", href: "#who-are-we" },
    { name: "Projects", href: "/projects" },
    { name: "Events", href: "/events" },
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
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] shadow-[var(--shadow-sm)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-display font-bold text-[var(--fg)]">
            {nav.logo?.text || "MNNIT Robotics"}
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {(nav.links ?? []).map((link: any) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="h-5 w-px bg-[var(--border)]" />
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">
                  {user.name || "Profile"}
                </Link>
                <UserAvatar />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/signin" className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 flex flex-col justify-center items-center gap-1.5"
              aria-label="Menu"
            >
              <span className={`w-5 h-[1.5px] bg-[var(--fg)] transition-all ${isOpen ? "rotate-45 translate-y-[4px]" : ""}`} />
              <span className={`w-5 h-[1.5px] bg-[var(--fg)] transition-all ${isOpen ? "-rotate-45 -translate-y-[3px]" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[var(--bg)] border-t border-[var(--border)]"
          >
            <div className="px-6 py-4 space-y-1">
              {(nav.links ?? []).map((link: any) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-[var(--fg-secondary)] hover:text-[var(--fg)]"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-[var(--border)] my-3" />
              {user ? (
                <button
                  onClick={() => { signOut(); setIsOpen(false) }}
                  className="block py-2 text-[var(--fg-secondary)]"
                >
                  Sign out
                </button>
              ) : (
                <div className="flex gap-3 pt-1">
                  <Link href="/auth/signin" onClick={() => setIsOpen(false)} className="text-sm text-[var(--fg-secondary)]">
                    Log in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
