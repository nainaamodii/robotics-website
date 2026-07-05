'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Users, ArrowRight, Loader2 } from 'lucide-react'

interface Team {
  _id: string
  name: string
  description?: string
  leader: { _id: string; name: string }
  members: any[]
  maxMembers: number
}

export default function TeamsPage() {
  const router = useRouter()
  const { user, isSignedIn, isLoading: authLoading } = useAuth()
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!isSignedIn) {
        router.push('/auth/signin')
      } else {
        fetchTeams()
      }
    }
  }, [isSignedIn, authLoading, router])

  const fetchTeams = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teams', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setAllTeams(data)
        
        // Filter teams where user is a member or leader
        const userTeams = data.filter((team: Team) => 
          team.members.some((m: any) => m._id === user?._id) || 
          team.leader._id === user?._id
        )
        setMyTeams(userTeams)
      }
    } catch (error) {
      console.error('[v0] Error fetching teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF] mx-auto mb-4" />
            <p className="text-neutral-400">Loading teams...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold text-neutral-100 mb-2">Teams</h1>
            <p className="text-neutral-400">Create and manage your team collaborations</p>
          </motion.div>
          <Link href="/teams/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E55B5B] to-[#E55B5B]/80 hover:from-[#E55B5B]/90 hover:to-[#E55B5B]/70 text-white rounded-lg transition-all font-semibold shadow-lg"
            >
              <Plus size={20} />
              Create New Team
            </motion.button>
          </Link>
        </div>

        {/* My Teams Section */}
        {myTeams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-neutral-100 mb-6 flex items-center gap-2">
              <Users size={24} className="text-[#E55B5B]" />
              My Teams ({myTeams.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map((team) => (
                <motion.div
                  key={team._id}
                  whileHover={{ y: -4 }}
                  className="soft-pop-card p-6 rounded-xl border border-neutral-800 hover:border-[#E55B5B]/50 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/teams/${team._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-100 group-hover:text-[#E55B5B] transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        Led by {team.leader.name}
                      </p>
                    </div>
                    <ArrowRight className="text-neutral-600 group-hover:text-[#E55B5B] transition-colors" size={20} />
                  </div>
                  
                  {team.description && (
                    <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{team.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-[#00D4FF]" />
                      <span className="text-neutral-300">
                        {team.members.length} / {team.maxMembers}
                      </span>
                    </div>
                    {team.leader._id === user?._id && (
                      <span className="text-xs px-2 py-1 bg-[#E55B5B]/20 text-[#E55B5B] rounded-full font-medium">
                        Leader
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Teams Browse Section */}
        {allTeams.length > myTeams.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-neutral-100 mb-6">Browse Available Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTeams
                .filter((team) => !myTeams.find((t) => t._id === team._id))
                .map((team) => (
                  <motion.div
                    key={team._id}
                    whileHover={{ y: -4 }}
                    className="soft-pop-card p-6 rounded-xl border border-neutral-800 hover:border-[#00D4FF]/50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/teams/${team._id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-neutral-100 group-hover:text-[#00D4FF] transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          Led by {team.leader.name}
                        </p>
                      </div>
                      <ArrowRight className="text-neutral-600 group-hover:text-[#00D4FF] transition-colors" size={20} />
                    </div>
                    
                    {team.description && (
                      <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{team.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={16} className="text-[#00D4FF]" />
                        <span className="text-neutral-300">
                          {team.members.length} / {team.maxMembers}
                        </span>
                      </div>
                      {team.members.length < team.maxMembers && (
                        <span className="text-xs px-2 py-1 bg-[#00D4FF]/20 text-[#00D4FF] rounded-full font-medium">
                          Open
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {allTeams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Users size={64} className="mx-auto text-neutral-700 mb-6" />
            <h3 className="text-2xl font-bold text-neutral-400 mb-2">No teams yet</h3>
            <p className="text-neutral-500 mb-8">Be the first to create a team and start collaborating!</p>
            <Link href="/teams/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E55B5B] hover:bg-[#E55B5B]/90 text-white rounded-lg transition-all font-semibold"
              >
                <Plus size={20} />
                Create First Team
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  )
}
