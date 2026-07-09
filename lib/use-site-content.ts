"use client"

import { useState, useEffect } from 'react'

const cache = new Map<string, { content: Record<string, any>; ts: number }>()
const CACHE_TTL = 60_000

export function useSiteContent<T = Record<string, any>>(sectionId: string, fallback?: T) {
  const [content, setContent] = useState<T | null>(() => {
    const cached = cache.get(sectionId)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.content as T
    return fallback ?? null
  })
  const [isLoading, setIsLoading] = useState(!cache.has(sectionId))

  useEffect(() => {
    const cached = cache.get(sectionId)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setContent(cached.content as T)
      setIsLoading(false)
      return
    }

    let cancelled = false

    fetch(`/api/site-content/${sectionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        cache.set(sectionId, { content: data.content, ts: Date.now() })
        setContent(data.content as T)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [sectionId])

  return { content, isLoading }
}
