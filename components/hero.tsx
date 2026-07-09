"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useSiteContent } from "@/lib/use-site-content"
import Link from "next/link"
import HeroFallback from "./hero-fallback"
import { ArrowRight } from "lucide-react"

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false })

const defaults = {
  tagline: "MNNIT Robotics Club",
  heading: "We build machines that think.",
  subheading: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
  ctaPrimary: { text: "Get Started", href: "/events" },
  ctaSecondary: { text: "View Projects", href: "/projects" },
}

export default function Hero() {
  const { user } = useAuth()
  const { content } = useSiteContent("hero", defaults)
  const hero = content ?? defaults

  const primaryHref = user ? (hero.ctaPrimary?.href || "/events") : "/auth/signin"

  return (
    <section className="relative min-h-screen flex items-center bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center py-24 lg:py-0">

        {/* Left — copy */}
        <div className="relative z-10 max-w-xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-[var(--accent)] mb-6"
          >
            {hero.tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-[var(--fg)] mb-6"
          >
            {hero.heading}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-[var(--fg-secondary)] leading-relaxed mb-10 max-w-lg"
          >
            {hero.subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
            >
              {hero.ctaPrimary?.text || "Get Started"} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={hero.ctaSecondary?.href || "/projects"}
              className="text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors"
            >
              {hero.ctaSecondary?.text || "View Projects"} &rarr;
            </Link>
          </motion.div>
        </div>

        {/* Right — 3D */}
        <div className="relative h-[450px] lg:h-[600px]" role="img" aria-label="3D robotic arm model">
          <Suspense fallback={<HeroFallback />}>
            <HeroScene />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
