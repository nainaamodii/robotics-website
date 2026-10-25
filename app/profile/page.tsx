'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Mail, Hash, ChevronRight, ChevronDown, ChevronUp,
  Activity, Loader2, Cpu, Trophy, Shield, LogOut, UserMinus,
  Crown, Copy, Check, Clock, CheckCircle, XCircle, FileText,
  AlertTriangle, ArrowRightLeft, Trash2, Phone, Edit3, Eye,
} from 'lucide-react'

type ApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
  draft: { label: 'Draft', color: 'text-zinc-500', bgColor: 'bg-zinc-500/10', borderColor: 'border-zinc-500/20', icon: FileText },
  submitted: { label: 'Under Review', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: XCircle },
}

function resolveStatus(team: any): ApprovalStatus {
  if (team.approvalStatus) return team.approvalStatus
  return team.isFinalized ? 'approved' : 'draft'
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [teamDetails, setTeamDetails] = useState<Record<string, any>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [leaveConfirmId, setLeaveConfirmId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [transferModal, setTransferModal] = useState<{ teamId: string; members: any[] } | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', rollNo: '', department: '', phone: '' })
  const [profileSaving, setProfileSaving] = useState(false)

  const showBanner = useCallback((kind: 'ok' | 'err', text: string) => {
    setBanner({ kind, text })
    setTimeout(() => setBanner(null), 4000)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/signin')
      } else {
        fetchTeams()
        setProfileForm({
          name: user.name || '',
          rollNo: user.rollNo || '',
          department: user.department || '',
          phone: user.phone || '',
        })
      }
    }
  }, [user, isLoading, router])

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/user/team', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUserTeams(Array.isArray(data) ? data : [])
      }
    } catch {}
    finally { setTeamLoading(false) }
  }

  const fetchTeamDetails = async (teamId: string) => {
    if (teamDetails[teamId]) return
    try {
      const res = await fetch(`/api/teams/${teamId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTeamDetails(prev => ({ ...prev, [teamId]: data }))
      }
    } catch {}
  }

  const toggleExpand = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
    } else {
      setExpandedTeamId(teamId)
      fetchTeamDetails(teamId)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleLeaveTeam = async (teamId: string) => {
    setActionLoading(teamId)
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, { method: 'POST', credentials: 'include' })
      if (res.ok) {
        showBanner('ok', 'Left team successfully')
        setLeaveConfirmId(null)
        setExpandedTeamId(null)
        setTeamDetails(prev => { const n = { ...prev }; delete n[teamId]; return n })
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner('err', d?.error ?? 'Failed to leave team')
      }
    } catch { showBanner('err', 'Failed to leave team') }
    finally { setActionLoading(null) }
  }

  const handleDeleteTeam = async (teamId: string) => {
    setActionLoading(teamId)
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        showBanner('ok', 'Team deleted')
        setDeleteConfirmId(null)
        setExpandedTeamId(null)
        setTeamDetails(prev => { const n = { ...prev }; delete n[teamId]; return n })
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner('err', d?.error ?? 'Failed to delete team')
      }
    } catch { showBanner('err', 'Failed to delete team') }
    finally { setActionLoading(null) }
  }

  const handleKickMember = async (teamId: string, memberId: string, memberName?: string) => {
    if (!confirm(`Remove ${memberName || 'this member'} from the team?`)) return
    setActionLoading(memberId)
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        showBanner('ok', 'Member removed')
        setTeamDetails(prev => { const n = { ...prev }; delete n[teamId]; return n })
        fetchTeamDetails(teamId)
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner('err', d?.error ?? 'Failed to remove member')
      }
    } catch { showBanner('err', 'Failed to remove member') }
    finally { setActionLoading(null) }
  }

  const handleTransferLeadership = async (teamId: string, newLeaderId: string) => {
    setActionLoading(newLeaderId)
    try {
      const res = await fetch(`/api/teams/${teamId}/transfer-leadership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newLeaderId }),
      })
      if (res.ok) {
        showBanner('ok', 'Leadership transferred')
        setTransferModal(null)
        setTeamDetails(prev => { const n = { ...prev }; delete n[teamId]; return n })
        fetchTeamDetails(teamId)
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner('err', d?.error ?? 'Failed to transfer leadership')
      }
    } catch { showBanner('err', 'Failed to transfer leadership') }
    finally { setActionLoading(null) }
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const res = await fetch(`/api/users/${user!._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      })
      if (res.ok) {
        showBanner('ok', 'Profile updated')
        setEditingProfile(false)
        window.location.reload()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner('err', d?.error ?? 'Failed to update profile')
      }
    } catch { showBanner('err', 'Failed to update profile') }
    finally { setProfileSaving(false) }
  }

  if (isLoading || teamLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-[var(--fg-tertiary)] animate-spin" />
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) return null

  const teamStats = {
    total: userTeams.length,
    leading: userTeams.filter(t => t.leaderId?.toString() === user._id).length,
    approved: userTeams.filter(t => resolveStatus(t) === 'approved').length,
    pending: userTeams.filter(t => ['draft', 'submitted'].includes(resolveStatus(t))).length,
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
                banner.kind === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {banner.text}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--fg)] tracking-tight mb-2">Profile</h1>
          <p className="text-[var(--fg-secondary)]">Your account, teams, and event participations</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Identity + Stats */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-6">
            {/* Identity Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 sticky top-28">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-[var(--fg)]">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-[var(--fg)]">{user.name}</h2>
                {user.codename && <span className="text-xs text-[var(--fg-tertiary)] mt-0.5 font-mono">@{user.codename}</span>}
                <span className="text-xs text-[var(--fg-tertiary)] mt-1">Member</span>
              </div>

              {editingProfile ? (
                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--fg-tertiary)] mb-1 block">Name</label>
                    <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--fg)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--fg-tertiary)] mb-1 block">Roll No</label>
                    <input value={profileForm.rollNo} onChange={e => setProfileForm(p => ({ ...p, rollNo: e.target.value }))} className="w-full rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--fg)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--fg-tertiary)] mb-1 block">Department</label>
                    <input value={profileForm.department} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} className="w-full rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--fg)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--fg-tertiary)] mb-1 block">Phone</label>
                    <input value={profileForm.phone} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--fg)] focus:outline-none" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleProfileSave} disabled={profileSaving} className="flex-1 py-2 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      {profileSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                    <button onClick={() => setEditingProfile(false)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--fg-secondary)] hover:border-[var(--border-hover)] transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2 text-[var(--fg-tertiary)]">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Email</span>
                      </div>
                      <span className="text-sm text-[var(--fg)] truncate max-w-[160px]">{user.email}</span>
                    </div>
                    {user.rollNo && (
                      <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--fg-tertiary)]">
                          <Hash className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wider">Roll No</span>
                        </div>
                        <span className="text-sm text-[var(--fg)]">{user.rollNo}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--fg-tertiary)]">
                          <Cpu className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wider">Dept</span>
                        </div>
                        <span className="text-sm text-[var(--fg)]">{user.department}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--fg-tertiary)]">
                          <Phone className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wider">Phone</span>
                        </div>
                        <span className="text-sm text-[var(--fg)]">{user.phone}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="w-full mt-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--fg-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--fg)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Right column: Stats + Teams */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--fg)]">{teamStats.total}</p>
                <p className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">Teams</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xl font-bold text-[var(--fg)]">{teamStats.leading}</p>
                <p className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">Leading</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-[var(--fg)]">{teamStats.approved}</p>
                <p className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">Approved</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xl font-bold text-[var(--fg)]">{teamStats.pending}</p>
                <p className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider">Pending</p>
              </div>
            </motion.div>

            {/* Teams list */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[var(--fg-tertiary)]" />
                My Participations
              </h3>

              {userTeams.length > 0 ? (
                <div className="space-y-3">
                  {userTeams.map(team => {
                    const isLeader = team.leaderId?.toString() === user._id
                    const status = resolveStatus(team)
                    const cfg = STATUS_CONFIG[status]
                    const StatusIcon = cfg.icon
                    const isExpanded = expandedTeamId === team._id
                    const details = teamDetails[team._id]
                    const editable = status === 'draft' || status === 'rejected'

                    return (
                      <div key={team._id} className={`rounded-xl border bg-[var(--bg-secondary)] overflow-hidden transition-colors ${isExpanded ? 'border-[var(--border-hover)]' : 'border-[var(--border)]'}`}>
                        {/* Team header */}
                        <button onClick={() => toggleExpand(team._id)} className="w-full p-5 flex items-center gap-4 text-left hover:bg-[var(--bg-tertiary)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-semibold text-[var(--fg)]">{team.name}</h4>
                              {isLeader && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">Leader</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {team.competitionName && (
                                <span className="text-xs text-[var(--fg-tertiary)] flex items-center gap-1"><Trophy size={11} /> {team.competitionName}</span>
                              )}
                              <span className="text-xs text-[var(--fg-tertiary)] flex items-center gap-1"><Users size={11} /> {team.members?.length || 0} members</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>
                            <StatusIcon size={12} /> {cfg.label}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />}
                        </button>

                        {/* Expanded panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-[var(--border)]"
                            >
                              <div className="p-5 space-y-4">
                                {/* Team code + status info */}
                                <div className="flex flex-wrap gap-4">
                                  {editable && (
                                    <div className="flex items-center gap-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] px-4 py-2.5">
                                      <div>
                                        <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider">Invite Code</p>
                                        <p className="text-lg font-bold tracking-[0.15em] text-[var(--fg)] font-mono">{team.teamCode || details?.teamCode || '...'}</p>
                                      </div>
                                      <button onClick={() => copyCode(team.teamCode || details?.teamCode)} className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors">
                                        {copiedCode === (team.teamCode || details?.teamCode) ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-[var(--fg-tertiary)]" />}
                                      </button>
                                    </div>
                                  )}
                                  {status === 'rejected' && (details?.rejectedReason || team.rejectedReason) && (
                                    <div className="flex-1 min-w-[200px] flex gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-sm">
                                      <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider mb-0.5">Rejected</p>
                                        <p className="text-[var(--fg-secondary)] text-xs">{details?.rejectedReason || team.rejectedReason}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Members */}
                                <div>
                                  <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-2"><Users size={12} /> Members</p>
                                  {details ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {details.members?.map((m: any) => {
                                        const isMemberLeader = m._id === details.leaderId?.toString()
                                        return (
                                          <div key={m._id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                                            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--fg-secondary)]">
                                              {(m.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-[var(--fg)] truncate">{m.name || 'Unknown'}</p>
                                              <p className="text-xs text-[var(--fg-tertiary)] truncate">{m.email}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {isMemberLeader && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">Leader</span>
                                              )}
                                              {isLeader && !isMemberLeader && editable && (
                                                <button
                                                  onClick={() => handleKickMember(team._id, m._id, m.name)}
                                                  disabled={actionLoading === m._id}
                                                  className="text-xs p-1.5 rounded-lg text-[var(--fg-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                  title="Remove member"
                                                >
                                                  {actionLoading === m._id ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm text-[var(--fg-tertiary)]">
                                      <Loader2 size={14} className="animate-spin" /> Loading...
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border)]">
                                  <Link href={`/teams/${team._id}`} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity">
                                    <Eye size={13} /> Open Team Page <ChevronRight size={13} />
                                  </Link>

                                  {isLeader && editable && details?.members && details.members.length > 1 && (
                                    <button
                                      onClick={() => setTransferModal({ teamId: team._id, members: details.members.filter((m: any) => m._id !== user._id) })}
                                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                                    >
                                      <ArrowRightLeft size={13} /> Transfer Leadership
                                    </button>
                                  )}

                                  {!isLeader && editable && (
                                    <button
                                      onClick={() => setLeaveConfirmId(team._id)}
                                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[var(--fg-tertiary)] hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                                    >
                                      <LogOut size={13} /> Leave Team
                                    </button>
                                  )}

                                  {isLeader && status !== 'approved' && (
                                    <button
                                      onClick={() => setDeleteConfirmId(team._id)}
                                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[var(--fg-tertiary)] hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors ml-auto"
                                    >
                                      <Trash2 size={13} /> Delete Team
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-[var(--fg-tertiary)]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[var(--fg)] mb-2">No participations yet</h3>
                  <p className="text-[var(--fg-secondary)] text-sm max-w-md mx-auto mb-6">
                    Join an event competition to create or join a team.
                  </p>
                  <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity">
                    Browse Events
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Leave team confirmation */}
      <AnimatePresence>
        {leaveConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6" onClick={() => setLeaveConfirmId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-amber-500" /></div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--fg)]">Leave Team</h3>
                  <p className="text-sm text-[var(--fg-secondary)]">You'll need a new invite to rejoin.</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={() => setLeaveConfirmId(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">Cancel</button>
                <button onClick={() => handleLeaveTeam(leaveConfirmId)} disabled={actionLoading === leaveConfirmId} className="px-5 py-2.5 rounded-full text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {actionLoading === leaveConfirmId ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />} Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete team confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6" onClick={() => setDeleteConfirmId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--fg)]">Delete Team</h3>
                  <p className="text-sm text-[var(--fg-secondary)]">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-[var(--fg-secondary)] mb-5">All team data, invitations, and project associations will be permanently removed.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">Cancel</button>
                <button onClick={() => handleDeleteTeam(deleteConfirmId)} disabled={actionLoading === deleteConfirmId} className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {actionLoading === deleteConfirmId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer leadership modal */}
      <AnimatePresence>
        {transferModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6" onClick={() => setTransferModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold text-[var(--fg)] mb-2">Transfer Leadership</h3>
              <p className="text-sm text-[var(--fg-secondary)] mb-4">Select a team member to become the new leader. You'll remain a member.</p>
              <div className="space-y-2 mb-4">
                {transferModal.members.map((m: any) => (
                  <button
                    key={m._id}
                    onClick={() => handleTransferLeadership(transferModal.teamId, m._id)}
                    disabled={actionLoading === m._id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-secondary)] transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--fg-secondary)]">
                      {(m.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--fg)] truncate">{m.name || 'Unknown'}</p>
                      <p className="text-xs text-[var(--fg-tertiary)] truncate">{m.email}</p>
                    </div>
                    {actionLoading === m._id ? <Loader2 size={14} className="animate-spin text-[var(--fg-tertiary)]" /> : <Crown size={14} className="text-[var(--fg-tertiary)]" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setTransferModal(null)} className="w-full py-2.5 rounded-full text-sm font-medium text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
