"use client"

import type { ReactNode } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Starfield from "./starfield"

/** Mission-control shell (follows the site's light/dark toggle) shared by the sign-in → events → registration flow. */
export default function RealmPage({
  children,
  footer = true,
  stars = true,
}: {
  children: ReactNode
  footer?: boolean
  stars?: boolean
}) {
  return (
    <div className="realm min-h-screen relative">
      {stars && <Starfield />}
      <div className="relative z-10">
        <Navbar />
        <main id="main">{children}</main>
        {footer && <Footer />}
      </div>
    </div>
  )
}

/** "01 — LABEL" telemetry-style section marker. */
export function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <p className="realm-eyebrow flex items-center gap-3">
      {index && <span className="text-[var(--accent)]">{index}</span>}
      {index && <span className="h-px w-8 bg-[var(--border-hover)]" />}
      {children}
    </p>
  )
}
