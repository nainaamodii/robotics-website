"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { motion } from "framer-motion"
import { Terminal, ArrowRight, Loader2, ShieldCheck } from "lucide-react"

export default function ParticipatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: competitionId } = use(params)
    const router = useRouter()
    const [mode, setMode] = useState<"join" | "create">("join")
    const [isLoading, setIsLoading] = useState(false)
    const [isChecking, setIsChecking] = useState(true) // New loading state for initial check
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        teamName: "",
        teamCode: "",
    })

    // 1. ON LOAD: Check if user is already in a team
    useEffect(() => {
        const checkExistingParticipation = async () => {
            try {
                // We send a dummy create request just to trigger the "alreadyJoined" check in our API
                // Or ideally, create a specific GET endpoint. For now, reusing the logic efficiently:
                const res = await fetch("/api/participate", {
                    method: "POST",
                    body: JSON.stringify({
                        action: "CHECK", // We can use a dummy action or just rely on the existingTeam check
                        competitionId
                    }),
                })

                const data = await res.json();

                // If the API returns existing team data (because of the check we added in step 2)
                if (data.alreadyJoined && data.team) {
                    router.push(`/teams/${data.team._id}`);
                }
            } catch (e) {
                console.error("Check failed", e);
            } finally {
                setIsChecking(false);
            }
        };

        checkExistingParticipation();
    }, [competitionId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/participate", {
                method: "POST",
                body: JSON.stringify({
                    action: mode.toUpperCase(),
                    competitionId,
                    ...formData,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Operation failed")

            // Handle the nested structure if coming from MongoDB driver directly or our helper
            const teamId = data._id || (data.team && data.team._id) || (data.value && data.value._id);

            if (!teamId) throw new Error("Team ID missing");

            router.push(`/teams/${teamId}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isChecking) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
                    <p className="text-neutral-500 font-mono text-xs">VERIFYING PARTICIPATION STATUS...</p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            <div className="max-w-xl mx-auto pt-32 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 border border-white/10 p-8 rounded-lg relative overflow-hidden"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Terminal className="text-[#00D4FF]" /> Participation <span className="text-[#E55B5B]">Hub</span>
                        </h1>
                        <p className="text-neutral-500 font-mono text-xs mt-2 uppercase">Target_ID: {competitionId}</p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex bg-black/50 p-1 rounded mb-8 border border-white/5">
                        <button
                            onClick={() => setMode("join")}
                            className={`flex-1 py-2 text-sm font-bold uppercase transition-all ${mode === "join" ? "bg-[#00D4FF] text-black" : "text-neutral-500 hover:text-white"}`}
                        >
                            Join Team
                        </button>
                        <button
                            onClick={() => setMode("create")}
                            className={`flex-1 py-2 text-sm font-bold uppercase transition-all ${mode === "create" ? "bg-[#E55B5B] text-white" : "text-neutral-500 hover:text-white"}`}
                        >
                            Create Team
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === "join" ? (
                            <div>
                                <label className="block text-xs font-mono text-neutral-400 uppercase mb-2">Access Code</label>
                                <input
                                    type="text"
                                    placeholder="E.G. RB-X79Z"
                                    className="w-full bg-black border border-white/10 p-4 rounded font-mono text-xl tracking-widest focus:border-[#00D4FF] outline-none transition-colors"
                                    value={formData.teamCode}
                                    onChange={(e) => setFormData({ ...formData, teamCode: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-mono text-neutral-400 uppercase mb-2">Team Designation (Name)</label>
                                <input
                                    type="text"
                                    placeholder="Enter Team Name"
                                    className="w-full bg-black border border-white/10 p-4 rounded focus:border-[#E55B5B] outline-none transition-colors"
                                    value={formData.teamName}
                                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono flex items-center gap-2">
                                <ShieldCheck size={16} /> {error}
                            </div>
                        )}

                        <button
                            disabled={isLoading}
                            className={`w-full py-4 font-black uppercase flex items-center justify-center gap-2 transition-all ${mode === "join" ? "bg-[#00D4FF] text-black hover:brightness-110" : "bg-[#E55B5B] text-white hover:brightness-110"
                                }`}
                            style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Initiate Protocol <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </motion.div>
            </div>
        </main>
    )
}