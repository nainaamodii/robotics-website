"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Calendar, MapPin, Save, X, Trophy, ListChecks } from "lucide-react"

// Types
type Event = {
    _id: string
    name: string
    theme: string
    tagline: string
    description: string
    date: string
    location: string
    competitions: any[]
}

type Competition = {
    _id?: string
    eventId: string
    title: string
    type: string
    description: string
    teamSize: string
    minTeamSize: number
    maxTeamSize: number
    rules: string[]
}

export function EventsManager() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

    // Edit/Create States
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null)
    const [editingComp, setEditingComp] = useState<Partial<Competition> | null>(null)

    // Temporary state for the "New Rule" input
    const [newRule, setNewRule] = useState("")

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/events")
            const data = await res.json()
            setEvents(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // --- EVENT HANDLERS ---

    const handleSaveEvent = async () => {
        if (!editingEvent) return
        const isNew = !editingEvent._id
        const url = isNew ? "/api/events" : `/api/events/${editingEvent._id}`
        const method = isNew ? "POST" : "PUT"

        try {
            // Remove _id from payload if it exists to be safe
            const { _id, ...payload } = editingEvent as any

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (res.ok) {
                fetchEvents()
                setEditingEvent(null)
            }
        } catch (e) {
            alert("Failed to save event")
        }
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Delete this event and ALL its competitions?")) return
        try {
            await fetch(`/api/events/${id}`, { method: "DELETE" })
            fetchEvents()
        } catch (e) { alert("Delete failed") }
    }

    // --- COMPETITION HANDLERS ---

    const handleAddRule = () => {
        if (!newRule.trim() || !editingComp) return;
        setEditingComp({
            ...editingComp,
            rules: [...(editingComp.rules || []), newRule.trim()]
        })
        setNewRule("")
    }

    const handleRemoveRule = (index: number) => {
        if (!editingComp || !editingComp.rules) return;
        const updatedRules = [...editingComp.rules];
        updatedRules.splice(index, 1);
        setEditingComp({ ...editingComp, rules: updatedRules });
    }

    const handleSaveComp = async () => {
        if (!editingComp) return
        const isNew = !editingComp._id
        const url = isNew ? "/api/competitions" : `/api/competitions/${editingComp._id}`
        const method = isNew ? "POST" : "PUT"

        try {
            // Explicitly remove _id to avoid circular update errors on some setups
            const { _id, ...payload } = editingComp as any;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }

            fetchEvents()
            setEditingComp(null)
            setNewRule("") // Clear temp input
        } catch (e: any) {
            console.error(e)
            alert(`Failed to save: ${e.message}`)
        }
    }

    const handleDeleteComp = async (id: string) => {
        if (!confirm("Delete this competition?")) return
        try {
            await fetch(`/api/competitions/${id}`, { method: "DELETE" })
            fetchEvents()
        } catch (e) { alert("Delete failed") }
    }

    if (loading) return <div className="text-neutral-400">Loading events...</div>

    return (
        <div className="space-y-8">
            {/* Header & Add Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage Events</h2>
                <button
                    onClick={() => setEditingEvent({ theme: 'red' })}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E55B5B] text-white rounded-lg hover:bg-[#E55B5B]/90"
                >
                    <Plus size={18} /> New Event
                </button>
            </div>

            {/* --- EDIT EVENT FORM OVERLAY --- */}
            {editingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editingEvent._id ? "Edit Event" : "Create Event"}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Event Name" className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingEvent.name || ""} onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })} />
                                <select className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingEvent.theme} onChange={e => setEditingEvent({ ...editingEvent, theme: e.target.value })}>
                                    <option value="red">Red Theme</option>
                                    <option value="cyan">Cyan Theme</option>
                                </select>
                            </div>
                            <input placeholder="Tagline" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white"
                                value={editingEvent.tagline || ""} onChange={e => setEditingEvent({ ...editingEvent, tagline: e.target.value })} />
                            <textarea placeholder="Description" className="w-full bg-black/50 border border-white/10 p-3 rounded h-24 text-white"
                                value={editingEvent.description || ""} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Date (e.g. OCT 24-26)" className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingEvent.date || ""} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} />
                                <input placeholder="Location" className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingEvent.location || ""} onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setEditingEvent(null)} className="px-4 py-2 hover:bg-white/10 rounded text-white">Cancel</button>
                                <button onClick={handleSaveEvent} className="px-6 py-2 bg-[#00D4FF] text-black font-bold rounded hover:bg-[#00D4FF]/90">Save Event</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT COMPETITION FORM OVERLAY --- */}
            {editingComp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4 text-white">{editingComp._id ? "Edit Competition" : "Add Competition"}</h3>
                        <div className="space-y-4">
                            <input placeholder="Title" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white"
                                value={editingComp.title || ""} onChange={e => setEditingComp({ ...editingComp, title: e.target.value })} />

                            <div className="grid grid-cols-3 gap-4">
                                <input placeholder="Type (e.g. Combat)" className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingComp.type || ""} onChange={e => setEditingComp({ ...editingComp, type: e.target.value })} />
                                <input type="number" placeholder="Min Members" className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingComp.minTeamSize || ""} onChange={e => setEditingComp({ ...editingComp, minTeamSize: parseInt(e.target.value) })} />
                                <input type="number" placeholder="Max Members" className="bg-black/50 border border-white/10 p-3 rounded text-white"
                                    value={editingComp.maxTeamSize || ""} onChange={e => setEditingComp({ ...editingComp, maxTeamSize: parseInt(e.target.value) })} />
                            </div>

                            <textarea placeholder="Description" className="w-full bg-black/50 border border-white/10 p-3 rounded h-24 text-white"
                                value={editingComp.description || ""} onChange={e => setEditingComp({ ...editingComp, description: e.target.value })} />

                            {/* --- NEW: RULES SECTION --- */}
                            <div className="border-t border-white/10 pt-4 mt-2">
                                <label className="text-sm font-bold text-neutral-400 mb-2 block flex items-center gap-2">
                                    <ListChecks size={16} /> Engagement Protocols (Rules)
                                </label>

                                {/* Input Area */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        placeholder="Add a new rule..."
                                        className="flex-1 bg-black/50 border border-white/10 p-2 rounded text-white text-sm"
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                                    />
                                    <button
                                        onClick={handleAddRule}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white"
                                        type="button"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Rules List */}
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {editingComp.rules?.map((rule, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm text-neutral-300">
                                            <span>{rule}</span>
                                            <button
                                                onClick={() => handleRemoveRule(idx)}
                                                className="text-neutral-500 hover:text-red-400 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingComp.rules || editingComp.rules.length === 0) && (
                                        <p className="text-xs text-neutral-500 italic">No protocols defined yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button onClick={() => { setEditingComp(null); setNewRule(""); }} className="px-4 py-2 hover:bg-white/10 rounded text-white">Cancel</button>
                                <button onClick={handleSaveComp} className="px-6 py-2 bg-[#E55B5B] text-white font-bold rounded hover:bg-[#E55B5B]/90">Save Module</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EVENTS LIST --- */}
            <div className="space-y-6">
                {events.map(event => (
                    <div key={event._id} className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-6 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedEvent(expandedEvent === event._id ? null : event._id)}>
                                {expandedEvent === event._id ? <ChevronUp className="text-neutral-400" /> : <ChevronDown className="text-neutral-400" />}
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        {event.name}
                                        <span className={`w-3 h-3 rounded-full ${event.theme === 'red' ? 'bg-[#E55B5B]' : 'bg-[#00D4FF]'}`} />
                                    </h3>
                                    <div className="flex gap-4 text-sm text-neutral-400 mt-1">
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {event.date}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingEvent(event)} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white"><Edit2 size={18} /></button>
                                <button onClick={() => handleDeleteEvent(event._id)} className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-[#E55B5B]"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        {/* Nested Competitions */}
                        <AnimatePresence>
                            {expandedEvent === event._id && (
                                <motion.div
                                    initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                    className="bg-black/30 border-t border-white/10"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Competitions Module</h4>
                                            <button
                                                onClick={() => setEditingComp({ eventId: event._id, minTeamSize: 1, maxTeamSize: 4, rules: [] })}
                                                className="text-xs flex items-center gap-1 text-[#00D4FF] hover:underline"
                                            >
                                                <Plus size={14} /> Add Competition
                                            </button>
                                        </div>

                                        <div className="grid gap-4">
                                            {event.competitions?.map((comp: Competition) => (
                                                <div key={comp._id} className="flex items-center justify-between p-4 border border-white/5 rounded bg-neutral-900/50 hover:border-white/20 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white/5 rounded"><Trophy size={16} className="text-yellow-500" /></div>
                                                        <div>
                                                            <p className="font-bold text-white">{comp.title}</p>
                                                            <p className="text-xs text-neutral-500">{comp.type} • {comp.minTeamSize}-{comp.maxTeamSize} Members • {comp.rules?.length || 0} Rules</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingComp(comp)} className="p-2 hover:bg-white/10 rounded text-neutral-500 hover:text-white"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDeleteComp(comp._id!)} className="p-2 hover:bg-white/10 rounded text-neutral-500 hover:text-[#E55B5B]"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!event.competitions || event.competitions.length === 0) && (
                                                <div className="text-center py-4 text-neutral-600 text-sm italic">No competitions added yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    )
}