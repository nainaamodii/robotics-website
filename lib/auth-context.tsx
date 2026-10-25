'use client'

import React, { createContext, useContext, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export interface AuthUser {
  _id?: string
  email: string
  emailVerified?: boolean
  name: string
  rollNo?: string
  department?: string
  phone?: string
  college?: string
  isMnnit?: boolean
  isProfileComplete?: boolean
  profileImage?: string
  bio?: string
  teamId?: string
  codename?: string
}

const PROFILE_GATE_ALLOWLIST = [
  "/onboarding/complete-profile",
  "/auth/signin",
  "/api",
]

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { signal: controller.signal })
        if (res.ok) {
          setUser(await res.json())
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
        clearTimeout(timeout)
      }
    }
    checkAuth()
    return () => { controller.abort(); clearTimeout(timeout) }
  }, [])

  useEffect(() => {
    if (isLoading || !user) return
    if (user.isProfileComplete) return
    if (!pathname) return
    if (PROFILE_GATE_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(p + "/"))) return
    router.replace(`/onboarding/complete-profile?next=${encodeURIComponent(pathname)}`)
  }, [isLoading, user, pathname, router])

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/auth/signin")
      router.refresh()
    } catch (error) {
      console.error("Logout error", error)
    }
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (res.ok) {
        setUser(await res.json())
      }
    } catch (error) {
      console.error("Failed to refresh user", error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn: !!user,
    signOut,
    updateProfile,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
