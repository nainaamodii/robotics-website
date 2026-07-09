"use client"

export default function HeroFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]">
      <div className="w-48 h-48 rounded-full border border-[var(--border)] animate-pulse" />
    </div>
  )
}
