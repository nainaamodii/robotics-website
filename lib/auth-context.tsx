// lib/auth-context.ts
'use client'

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export interface AuthUser {
  _id?: string
  email: string
  name: string
  rollNo?: string
  department?: string
  phone?: string
  profileImage?: string
  bio?: string
  teamId?: string
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isSignedIn: boolean
  signUp: (email: string, password: string, name: string, rollNo?: string, department?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 1. Check for valid session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Session check failed", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  // 2. Sign In Implementation
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Sign in failed")
      }

      setUser(data.user)
      router.refresh() // Refresh server components
    } catch (error) {
      throw error // Re-throw to be caught by the Login Page
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Sign Up Implementation
  const signUp = async (email: string, password: string, name: string, rollNo?: string, department?: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, rollNo, department }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setUser(data.user)
      router.refresh()
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Sign Out Implementation (Fixes your logout button)
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

  // 5. Update Profile Stub
  const updateProfile = async (updates: Partial<AuthUser>) => {
    // You can implement a route for /api/user/update later
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const value = {
    user,
    isLoading,
    isSignedIn: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={ value }> { children } </AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}