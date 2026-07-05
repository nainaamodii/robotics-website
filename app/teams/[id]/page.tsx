"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Navbar from "@/components/navbar"
import { Users, Copy, Check, ShieldAlert, Rocket, Loader2, Terminal, Trophy } from "lucide-react"

export default function TeamWarRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = use(params)
  const { user } = useAuth()
  const router = useRouter()

  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then(res => res.json())
      .then(data => {
        setTeam(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [teamId])

  const copyCode = () => {
    navigator.clipboard.writeText(team.teamCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFinalize = async () => {
    if (!confirm("Finalizing locks your team members. Ready to compete?")) return
    setIsFinalizing(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/finalize`, { method: 'POST' })
      if (res.ok) window.location.reload()
    } catch (err) {
      alert("Finalization failed")
    } finally {
      setIsFinalizing(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-[#00D4FF] font-mono">LOADING_TEAM_DATA...</div>
  if (!team) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-red-500">TEAM NOT FOUND</div>

  const isLeader = user?._id === team?.leaderId

  return (
    <main className="min-h-screen bg-neutral-950 text-white pb-20">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-32 px-4">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            {/* 1. COMPETITION NAME BADGE */}
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-neutral-900 border border-white/10 rounded-full">
              <Trophy size={14} className="text-[#00D4FF]" />
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
                {team.competitionName}
              </span>
            </div>

            {/* 2. TEAM NAME */}
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
              {team.name}
            </h1>

            <p className="text-neutral-500 font-mono mt-2 flex items-center gap-2">
              STATUS: {team.isFinalized ?
                <span className="text-green-500 font-bold">[ DEPLOYED ]</span> :
                <span className="text-yellow-500 font-bold">[ ASSEMBLING ]</span>
              }
            </p>
          </div>

          {/* Invitation Code Box */}
          {!team.isFinalized && (
            <div className="bg-neutral-900 border border-[#00D4FF]/30 p-4 rounded-lg flex items-center gap-4">
              <div>
                <p className="text-[10px] font-mono text-[#00D4FF] uppercase mb-1">Invite_Code</p>
                <p className="text-2xl font-black tracking-widest">{team.teamCode}</p>
              </div>
              <button onClick={copyCode} className="p-3 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black transition-all rounded">
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Member List */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-neutral-400 uppercase text-sm tracking-widest border-b border-white/5 pb-2">
              <Users size={16} /> Personnel_Manifest
            </h3>
            {team.members.map((member: any, i: number) => (
              <div key={i} className="bg-neutral-900/50 border border-white/5 p-4 flex justify-between items-center rounded hover:bg-white/5 transition-colors">
                <div className="flex flex-col">
                  <span className="font-mono text-lg text-white">{member.name || "Unknown Cadet"}</span>
                  <span className="text-xs text-neutral-500 font-mono">{member.email}</span>
                </div>
                {member._id === team.leaderId && (
                  <span className="text-[10px] bg-[#E55B5B]/20 text-[#E55B5B] px-2 py-1 font-bold rounded border border-[#E55B5B]/30">LEAD</span>
                )}
              </div>
            ))}
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            <div className="bg-neutral-900 p-6 border border-white/10 rounded-lg">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Terminal size={16} className="text-[#E55B5B]" /> Instructions
              </h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                {team.isFinalized ?
                  "Registration complete. Awaiting competition commencement. Personnel list is now locked." :
                  "Share your Invite Code with your teammates. Once everyone has joined, the Team Leader must click Finalize to secure your spot."
                }
              </p>

              {isLeader && !team.isFinalized && (
                <button
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  className="w-full mt-6 py-4 bg-[#E55B5B] text-white font-black uppercase flex items-center justify-center gap-2 hover:brightness-125 transition-all"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                >
                  {isFinalizing ? <Loader2 className="animate-spin" /> : <><Rocket size={18} /> Finalize Registration</>}
                </button>
              )}
            </div>

            {/* Alert for Non-Leaders */}
            {!isLeader && !team.isFinalized && (
              <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-500 flex gap-3 rounded">
                <ShieldAlert className="shrink-0" size={16} />
                <div>
                  <span className="font-bold block mb-1">WAITING FOR LEADER</span>
                  Awaiting Team Leader to finalize deployment protocols.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}