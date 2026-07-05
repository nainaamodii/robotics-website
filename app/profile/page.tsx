'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Mail, Smartphone, Shield,
  Cpu, Activity, Hash, ChevronRight,
  Trophy, ScanFace, Layers
} from 'lucide-react'

interface TeamData {
  _id: string
  name: string
  description?: string
  members: any[]
  leaderId: string // Ensure this matches your API response (leaderId vs leader object)
  maxMembers: number
  competitionName?: string
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  // Changed state to hold an ARRAY of teams
  const [userTeams, setUserTeams] = useState<TeamData[]>([])
  const [teamLoading, setTeamLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/signin')
      } else {
        fetchDeployments()
      }
    }
  }, [user, isLoading, router])

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/user/team', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Ensure we always set an array
        setUserTeams(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to retrieve deployment data:', error)
    } finally {
      setTeamLoading(false)
    }
  }

  if (isLoading || teamLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#00D4FF] font-mono text-sm animate-pulse">SCANNING_DATABASE...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <Navbar />

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(#00D4FF 1px, transparent 1px), linear-gradient(90deg, #00D4FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00D4FF]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 pt-32 pb-20 relative z-10">

        {/* --- PAGE TITLE --- */}
        <div className="mb-12 flex items-center gap-4">
          <div className="w-1 h-12 bg-[#E55B5B]" />
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
              Operator <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E55B5B] to-orange-500">Profile</span>
            </h1>
            <p className="text-neutral-500 font-mono text-sm tracking-widest">
              ID: {user._id?.slice(-8).toUpperCase()} // SYSTEM_AUTHORIZED
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* --- LEFT COL: PERSONAL IDENTITY CARD --- */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-neutral-900/50 backdrop-blur-md border border-white/10 relative overflow-hidden group sticky top-32">
              {/* Tech Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-[#00D4FF]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-[#00D4FF]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-[#00D4FF]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-[#00D4FF]" />

              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D4FF]/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000" />

              <div className="p-8 flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-6">
                  <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-2 bg-gradient-to-b from-[#00D4FF]/20 to-transparent rounded-full flex items-center justify-center border border-[#00D4FF]/50">
                    <span className="text-4xl font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 mb-6">
                  <Shield size={12} className="text-[#00D4FF]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#00D4FF]">Level 1 Operative</span>
                </div>

                {/* Data Grid */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-3 text-neutral-400">
                      <Mail size={16} />
                      <span className="text-xs font-mono uppercase">Comm_Link</span>
                    </div>
                    <span className="text-sm text-white truncate max-w-[140px]">{user.email}</span>
                  </div>
                  {user.rollNo && (
                    <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-3 text-neutral-400">
                        <Hash size={16} />
                        <span className="text-xs font-mono uppercase">Unit_ID</span>
                      </div>
                      <span className="text-sm text-white font-mono">{user.rollNo}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-sm">
                      <div className="flex items-center gap-3 text-neutral-400">
                        <Cpu size={16} />
                        <span className="text-xs font-mono uppercase">Division</span>
                      </div>
                      <span className="text-sm text-white">{user.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT COL: DEPLOYMENT HISTORY --- */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="bg-neutral-900/50 border border-white/10 p-6 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                  <Activity size={64} />
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-sm flex items-center justify-center border border-green-500/20">
                  <Activity size={24} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-mono uppercase">Deployments</p>
                  <p className="text-xl font-bold text-white">{userTeams.length} Active</p>
                </div>
              </div>

              <div className="bg-neutral-900/50 border border-white/10 p-6 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-3 opacity-10">
                  <Trophy size={64} />
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-sm flex items-center justify-center border border-yellow-500/20">
                  <Trophy size={24} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-mono uppercase">Unit Rank</p>
                  <p className="text-xl font-bold text-white">Cadet</p>
                </div>
              </div>
            </motion.div>

            {/* List of Teams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={20} className="text-[#E55B5B]" />
                  Mission Log
                </h3>
              </div>

              {userTeams.length > 0 ? (
                <div className="space-y-6">
                  {userTeams.map((team) => (
                    <div key={team._id} className="bg-neutral-900/30 border border-white/10 relative group hover:border-[#00D4FF]/30 transition-colors">
                      {/* Decorative Header Line */}
                      <div className="h-1 w-full bg-gradient-to-r from-[#E55B5B] to-transparent group-hover:from-[#00D4FF] transition-colors" />

                      <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                          <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">
                              {team.name}
                            </h2>
                            {team.competitionName && (
                              <p className="text-[#00D4FF] font-mono text-xs uppercase tracking-widest">
                                // Mission: {team.competitionName}
                              </p>
                            )}
                          </div>

                          <Link href={`/teams/${team._id}`}>
                            <button className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 hover:bg-[#E55B5B] hover:text-white hover:border-[#E55B5B] transition-all text-sm font-bold uppercase tracking-wider group">
                              Access War Room
                              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        </div>

                        {/* Members Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {team.members.map((member: any) => (
                            <div key={member._id} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 hover:border-white/20 transition-colors">
                              <div className="w-8 h-8 bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-neutral-200 truncate">{member.name}</p>
                                <p className="text-[10px] text-neutral-500 font-mono truncate">{member.email}</p>
                              </div>
                              {member._id === team.leaderId && (
                                <span className="text-[10px] bg-[#E55B5B]/20 text-[#E55B5B] px-1.5 py-0.5 rounded border border-[#E55B5B]/30">LEAD</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-900/30 border border-dashed border-white/10 p-12 text-center relative overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
                      <Users size={24} className="text-neutral-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Active Unit Assigned</h3>
                    <p className="text-neutral-400 text-sm max-w-md mx-auto mb-8">
                      You are currently listed as a free agent. Navigate to the Events sector to identify a mission protocol and initialize a squad.
                    </p>

                    <Link href="/events">
                      <button className="px-8 py-3 bg-[#00D4FF] text-black font-bold uppercase tracking-wider text-sm hover:brightness-110 transition-all clip-path-button"
                        style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                      >
                        Browse Missions
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </main>
  )
}