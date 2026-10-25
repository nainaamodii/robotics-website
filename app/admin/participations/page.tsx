"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Navbar from "@/components/navbar"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Trophy, Users, CheckCircle, Clock, Download, ChevronLeft,
  Loader2, ChevronDown, ChevronUp, Shield, XCircle, Trash2, Eye,
  Mail, Phone, FileText, AlertTriangle, RefreshCw,
} from "lucide-react"
import Link from "next/link"

type ApprovalStatus = "draft" | "submitted" | "approved" | "rejected"
type FilterTab = "all" | ApprovalStatus

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
  draft: { label: "Draft", color: "text-zinc-500", bgColor: "bg-zinc-500/10", borderColor: "border-zinc-500/20", icon: FileText },
  submitted: { label: "Submitted", color: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: XCircle },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Drafts" },
]

export default function AdminParticipationsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [rejectModalTeamId, setRejectModalTeamId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const showBanner = useCallback((kind: "ok" | "err", text: string) => {
    setBanner({ kind, text })
    setTimeout(() => setBanner(null), 4000)
  }, [])

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teams?status=all")
      if (res.ok) setTeams(await res.json())
    } catch { showBanner("err", "Failed to load teams") }
    finally { setLoading(false) }
  }, [showBanner])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  const resolveStatus = (team: any): ApprovalStatus => {
    if (team.approvalStatus) return team.approvalStatus
    return team.isFinalized ? "approved" : "draft"
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch =
        team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leaderEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.competitionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.members?.some((m: any) => m.email?.toLowerCase().includes(searchTerm.toLowerCase()) || m.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        team.teamCode?.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      if (filter === "all") return true
      return resolveStatus(team) === filter
    })
  }, [teams, searchTerm, filter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: teams.length, draft: 0, submitted: 0, approved: 0, rejected: 0 }
    teams.forEach(t => { counts[resolveStatus(t)]++ })
    return counts
  }, [teams])

  const toggleExpand = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
    } else {
      setExpandedTeamId(teamId)
    }
  }

  const handleApprove = async (teamId: string) => {
    setActionLoading(teamId)
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/approve`, { method: "POST" })
      if (res.ok) {
        showBanner("ok", "Team approved successfully")
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner("err", d?.error ?? "Failed to approve team")
      }
    } catch { showBanner("err", "Failed to approve team") }
    finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModalTeamId) return
    setActionLoading(rejectModalTeamId)
    try {
      const res = await fetch(`/api/admin/teams/${rejectModalTeamId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      })
      if (res.ok) {
        showBanner("ok", "Team rejected")
        setRejectModalTeamId(null)
        setRejectReason("")
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner("err", d?.error ?? "Failed to reject team")
      }
    } catch { showBanner("err", "Failed to reject team") }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (teamId: string) => {
    setActionLoading(teamId)
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" })
      if (res.ok) {
        showBanner("ok", "Team deleted")
        setDeleteConfirmId(null)
        setExpandedTeamId(null)
        await fetchTeams()
      } else {
        const d = await res.json().catch(() => ({}))
        showBanner("err", d?.error ?? "Failed to delete team")
      }
    } catch { showBanner("err", "Failed to delete team") }
    finally { setActionLoading(null) }
  }

  const exportCSV = () => {
    // One row per team member so the sheet is directly usable for attendance/contact.
    const headers = ["Team Name", "Team Code", "Event", "Competition", "Status", "Role", "Member", "Email", "Email Verified", "Phone", "Roll No", "Department", "College", "Submitted", "Created"]
    const rows = filteredTeams.flatMap(t =>
      (t.members?.length ? t.members : [{}]).map((m: any) => [
        t.name,
        t.teamCode,
        t.eventName || "",
        t.competitionName || "",
        resolveStatus(t),
        String(m._id) === String(t.leaderId) ? "Leader" : "Member",
        m.name || "",
        m.email || "",
        m.emailVerified ? "yes" : "no",
        m.phone || "",
        m.rollNo || "",
        m.department || "",
        m.college || "",
        t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() : "",
        new Date(t.createdAt).toLocaleDateString(),
      ]),
    )
    const esc = (val: any) => {
      const s = String(val ?? "")
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.map(esc).join(","))].join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csv))
    link.setAttribute("download", "teams_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20">
        {/* Banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
                banner.kind === "ok"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {banner.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-tertiary)]">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--fg)] tracking-tight">Team Management</h1>
              <p className="text-[var(--fg-secondary)] mt-1 text-sm">Review, approve, and manage all team registrations.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setLoading(true); fetchTeams() }} className="px-4 py-2.5 rounded-full text-sm font-medium bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all flex items-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={exportCSV} className="px-4 py-2.5 rounded-full text-sm font-medium bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`p-4 rounded-xl border transition-all text-left ${
                filter === tab.key
                  ? "border-[var(--fg)] bg-[var(--bg-secondary)]"
                  : "border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="text-2xl font-bold text-[var(--fg)]">{statusCounts[tab.key] ?? 0}</p>
              <p className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider mt-1">{tab.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by team, code, member name/email, event or competition..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"
            />
          </div>
        </div>

        {/* Team list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[var(--fg-tertiary)] animate-spin" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl">
            <p className="text-[var(--fg-tertiary)] text-sm">No teams match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map(team => {
              const status = resolveStatus(team)
              const cfg = STATUS_CONFIG[status]
              const StatusIcon = cfg.icon
              const isExpanded = expandedTeamId === team._id
              const isBusy = actionLoading === team._id

              return (
                <motion.div
                  key={team._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border bg-[var(--bg-secondary)] overflow-hidden transition-colors ${
                    isExpanded ? "border-[var(--border-hover)]" : "border-[var(--border)]"
                  }`}
                >
                  {/* Row header */}
                  <button
                    onClick={() => toggleExpand(team._id)}
                    className="w-full p-5 flex items-center gap-4 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 md:gap-6 items-center">
                      {/* Team info */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--fg)] truncate">{team.name}</p>
                        <p className="text-xs text-[var(--fg-tertiary)] font-mono mt-0.5">{team.teamCode}{team.eventName ? ` · ${team.eventName}` : ""}</p>
                      </div>
                      {/* Competition */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Trophy size={13} className="text-[var(--fg-tertiary)] shrink-0" />
                        <span className="text-sm text-[var(--fg-secondary)] truncate">{team.competitionName || "—"}</span>
                      </div>
                      {/* Leader */}
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--fg)] truncate">{team.leaderName || "—"}</p>
                        <p className="text-xs text-[var(--fg-tertiary)] truncate">{team.leaderEmail}</p>
                      </div>
                      {/* Status + members */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>
                          <StatusIcon size={12} /> {cfg.label}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg)] text-[var(--fg-secondary)] text-xs border border-[var(--border)] shrink-0">
                          <Users size={11} /> {team.memberCount}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)] shrink-0" />}
                  </button>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[var(--border)]"
                      >
                        <div className="p-5 space-y-5">
                          {/* Info row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-1">Created</p>
                              <p className="text-[var(--fg-secondary)]">{new Date(team.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                            {team.submittedAt && (
                              <div>
                                <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-1">Submitted</p>
                                <p className="text-[var(--fg-secondary)]">{new Date(team.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                              </div>
                            )}
                            {team.approvedAt && (
                              <div>
                                <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-1">Approved</p>
                                <p className="text-emerald-600 dark:text-emerald-400">{new Date(team.approvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                              </div>
                            )}
                            {team.rejectedAt && (
                              <div>
                                <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-1">Rejected</p>
                                <p className="text-red-600 dark:text-red-400">{new Date(team.rejectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                              </div>
                            )}
                            {team.leaderPhone && (
                              <div>
                                <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-1">Leader Phone</p>
                                <p className="text-[var(--fg-secondary)] flex items-center gap-1.5"><Phone size={12} /> {team.leaderPhone}</p>
                              </div>
                            )}
                          </div>

                          {team.rejectedReason && (
                            <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-sm">
                              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-red-500 font-medium uppercase tracking-wider mb-0.5">Rejection Reason</p>
                                <p className="text-[var(--fg-secondary)]">{team.rejectedReason}</p>
                              </div>
                            </div>
                          )}

                          {/* Members */}
                          <div>
                            <p className="text-[10px] text-[var(--fg-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Users size={12} /> Team Members
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(team.members ?? []).map((m: any) => (
                                <div key={m._id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                                  <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--fg-secondary)] shrink-0">
                                    {(m.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--fg)] truncate">{m.name || "Unknown"}</p>
                                    <p className="text-xs text-[var(--fg-tertiary)] truncate flex items-center gap-1"><Mail size={10} /> {m.email}</p>
                                    {(m.phone || m.rollNo) && (
                                      <p className="text-xs text-[var(--fg-tertiary)] truncate mt-0.5">
                                        {[m.rollNo, m.phone].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                    {(m.department || m.college) && (
                                      <p className="text-xs text-[var(--fg-tertiary)] truncate">{[m.department, m.college].filter(Boolean).join(" · ")}</p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {String(m._id) === String(team.leaderId) && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">Leader</span>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${m.emailVerified ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}`}>
                                      {m.emailVerified ? "Email verified" : "Unverified"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
                            {status === "submitted" && (
                              <>
                                <button
                                  onClick={() => handleApprove(team._id)}
                                  disabled={isBusy}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                  {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModalTeamId(team._id); setRejectReason("") }}
                                  disabled={isBusy}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </>
                            )}
                            <Link href={`/teams/${team._id}`} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-[var(--bg)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
                              <Eye size={14} /> View Team Page
                            </Link>
                            <button
                              onClick={() => setDeleteConfirmId(team._id)}
                              disabled={isBusy}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[var(--fg-tertiary)] hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-50 ml-auto"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModalTeamId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
            onClick={() => setRejectModalTeamId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6"
            >
              <h3 className="font-display text-lg font-bold text-[var(--fg)] mb-2">Reject Team</h3>
              <p className="text-sm text-[var(--fg-secondary)] mb-4">The team will return to editable state. The leader can fix issues and resubmit.</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                rows={3}
                className="w-full rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm resize-none mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRejectModalTeamId(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === rejectModalTeamId}
                  className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === rejectModalTeamId ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject Team
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--fg)]">Delete Team</h3>
                  <p className="text-sm text-[var(--fg-secondary)]">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-[var(--fg-secondary)] mb-5">The team, all its invitations, and project associations will be permanently removed.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={actionLoading === deleteConfirmId}
                  className="px-5 py-2.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === deleteConfirmId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
