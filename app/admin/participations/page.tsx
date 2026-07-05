"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import { motion } from "framer-motion"
import { Search, Trophy, Users, CheckCircle, Clock, Download, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function AdminParticipationsPage() {
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filter, setFilter] = useState("ALL") // ALL, FINALIZED, PENDING

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/admin/participations")
                if (res.ok) {
                    const data = await res.json()
                    setTeams(data)
                }
            } catch (error) {
                console.error("Error loading participations", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredTeams = teams.filter(team => {
        const matchesSearch =
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.leaderEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.competitionName?.toLowerCase().includes(searchTerm.toLowerCase())

        if (filter === "FINALIZED") return matchesSearch && team.isFinalized
        if (filter === "PENDING") return matchesSearch && !team.isFinalized
        return matchesSearch
    })

    const exportCSV = () => {
        const headers = ["Team Name", "Competition", "Leader Name", "Leader Email", "Members", "Status", "Created At"]
        const rows = filteredTeams.map(t => [
            t.name,
            t.competitionName || "Unknown",
            t.leaderName || "Unknown",
            t.leaderEmail || "Unknown",
            t.memberCount,
            t.isFinalized ? "Finalized" : "Pending",
            new Date(t.createdAt).toLocaleDateString()
        ])

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "participations_data.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-32">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Link href="/admin" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                <ChevronLeft size={20} />
                            </Link>
                            <h1 className="text-4xl font-bold">Participation <span className="text-[#E55B5B]">Log</span></h1>
                        </div>
                        <p className="text-neutral-400">Monitor all team registrations across competitions.</p>
                    </div>

                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 rounded-lg hover:bg-[#00D4FF]/20 transition-colors"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search teams, leaders, or competitions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:border-[#E55B5B] outline-none text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["ALL", "FINALIZED", "PENDING"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === f ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:text-white"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-20 text-neutral-500">Loading participation data...</div>
                ) : (
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-neutral-900/30">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-neutral-400">
                                        <th className="p-4">Team Details</th>
                                        <th className="p-4">Competition</th>
                                        <th className="p-4">Leader</th>
                                        <th className="p-4 text-center">Members</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTeams.map((team) => (
                                        <motion.tr
                                            key={team._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="p-4">
                                                <p className="font-bold text-white">{team.name}</p>
                                                <p className="text-xs font-mono text-neutral-500">{team.teamCode}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Trophy size={14} className="text-[#E55B5B]" />
                                                    <span className="text-sm text-neutral-300">{team.competitionName || "Unknown"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-white">{team.leaderName}</p>
                                                <p className="text-xs text-neutral-500">{team.leaderEmail}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 text-xs">
                                                    <Users size={12} /> {team.memberCount}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {team.isFinalized ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                                                        <CheckCircle size={12} /> DEPLOYED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">
                                                        <Clock size={12} /> ASSEMBLING
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredTeams.length === 0 && (
                            <div className="p-12 text-center text-neutral-500">
                                No records found matching your filters.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}