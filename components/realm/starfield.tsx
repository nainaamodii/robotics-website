"use client"

import { useMemo } from "react"

/** Deterministic pseudo-random so server and client render the same stars (no hydration mismatch). */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export default function Starfield({ count = 90, className = "" }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: count }, () => ({
      x: r() * 100,
      y: r() * 100,
      size: r() < 0.9 ? 1 : 2,
      delay: r() * 6,
      dur: 3 + r() * 5,
    }))
  }, [count])

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-100 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(255,100,54,0.16),transparent_60%),radial-gradient(ellipse_at_50%_-20%,rgba(120,140,255,0.10),transparent_55%)]" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--fg)]"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `realm-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
    </div>
  )
}
