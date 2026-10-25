"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus, Trash2, Edit2, ChevronDown, ChevronUp, Calendar, MapPin,
    X, Trophy, ListChecks, Loader2, AlertCircle,
} from "lucide-react"

type Event = {
    _id: string
    name: string
    theme: string
    tagline: string
    description: string
    date: string        // display string, legacy
    startDate?: string  // ISO "YYYY-MM-DD"
    endDate?: string
    location: string
    participantsLabel?: string
    highlights?: string[]
    competitions: any[]
    status?: string
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

const inputClass =
    "w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] focus:border-[var(--fg)] focus:outline-none transition-colors text-sm"

// ─── Human-friendly error parsing (shared shape with the projects form) ───
const EVENT_FIELD_LABELS: Record<string, string> = {
    name: "Event name",
    startDate: "Start date",
    endDate: "End date",
    theme: "Theme",
    tagline: "Tagline",
    description: "Description",
    location: "Location",
    participantsLabel: "Participants label",
    highlights: "Highlights",
}

interface FieldError { field: string; message: string }
function parseApiError(data: any): { summary: string; fields: FieldError[] } {
    const summary = data?.error ?? "Failed to save event."
    const fields: FieldError[] = []
    const fe = data?.details?.fieldErrors
    if (fe && typeof fe === "object") {
        for (const key of Object.keys(fe)) {
            const msgs: string[] = Array.isArray(fe[key]) ? fe[key] : [String(fe[key])]
            for (const msg of msgs) {
                fields.push({ field: EVENT_FIELD_LABELS[key] ?? key, message: msg })
            }
        }
    }
    const formErrors = data?.details?.formErrors
    if (Array.isArray(formErrors)) {
        for (const msg of formErrors) fields.push({ field: "Form", message: String(msg) })
    }
    return { summary, fields }
}

// ─── Small preview of how the display date will look ───
function previewDate(start?: string, end?: string): string | null {
    if (!start || !end) return null
    const s = new Date(start), e = new Date(end)
    if (isNaN(+s) || isNaN(+e) || e < s) return null
    const mS = s.toLocaleString("en-US", { month: "short" }).toUpperCase()
    const mE = e.toLocaleString("en-US", { month: "short" }).toUpperCase()
    const dS = s.getDate(), dE = e.getDate()
    const yS = s.getFullYear(), yE = e.getFullYear()
    if (yS === yE && s.getMonth() === e.getMonth()) {
        return dS === dE ? `${mS} ${dS}, ${yS}` : `${mS} ${dS}-${dE}, ${yS}`
    }
    if (yS === yE) return `${mS} ${dS} - ${mE} ${dE}, ${yS}`
    return `${mS} ${dS}, ${yS} - ${mE} ${dE}, ${yE}`
}

export function EventsManager() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null)
    const [editingComp, setEditingComp] = useState<Partial<Competition> | null>(null)
    const [newRule, setNewRule] = useState("")
    const [newHighlight, setNewHighlight] = useState("")

    // Structured error state (was: window.alert)
    const [eventError, setEventError] = useState<{ summary: string; fields: FieldError[] } | null>(null)
    const [compError, setCompError] = useState<{ summary: string; fields: FieldError[] } | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchEvents() }, [])

    const fetchEvents = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/events")
            const data = await res.json()
            setEvents(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleSaveEvent = async () => {
        if (!editingEvent) return
        setEventError(null)
        setSaving(true)
        const isNew = !editingEvent._id
        const url = isNew ? "/api/events" : `/api/events/${editingEvent._id}`
        const method = isNew ? "POST" : "PUT"
        try {
            // Strip database and API-only fields (including computed `status`)
            // so `.strict()` on the update schema accepts the request.
            const {
                _id, date, year, status, competitions, createdAt, updatedAt, isActive,
                ...payload
            } = editingEvent as any
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setEventError(parseApiError(data))
                return
            }
            await fetchEvents()
            setEditingEvent(null)
        } catch (e: any) {
            setEventError({ summary: e?.message ?? "Failed to save event", fields: [] })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Delete this event and ALL its competitions?")) return
        try { await fetch(`/api/events/${id}`, { method: "DELETE", credentials: "include" }); fetchEvents() }
        catch (e) { alert("Delete failed") }
    }

    const handleAddRule = () => {
        if (!newRule.trim() || !editingComp) return
        setEditingComp({ ...editingComp, rules: [...(editingComp.rules || []), newRule.trim()] })
        setNewRule("")
    }

    const handleRemoveRule = (index: number) => {
        if (!editingComp?.rules) return
        const updatedRules = [...editingComp.rules]
        updatedRules.splice(index, 1)
        setEditingComp({ ...editingComp, rules: updatedRules })
    }

    const handleAddHighlight = () => {
        if (!newHighlight.trim() || !editingEvent) return
        setEditingEvent({
            ...editingEvent,
            highlights: [...(editingEvent.highlights || []), newHighlight.trim()],
        })
        setNewHighlight("")
    }

    const handleRemoveHighlight = (idx: number) => {
        if (!editingEvent?.highlights) return
        const next = [...editingEvent.highlights]
        next.splice(idx, 1)
        setEditingEvent({ ...editingEvent, highlights: next })
    }

    const handleSaveComp = async () => {
        if (!editingComp) return
        setCompError(null)
        try {
            const isNew = !editingComp._id
            const url = isNew ? "/api/competitions" : `/api/competitions/${editingComp._id}`
            const method = isNew ? "POST" : "PUT"
            const { _id, ...payload } = editingComp as any
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setCompError(parseApiError(data))
                return
            }
            fetchEvents(); setEditingComp(null); setNewRule("")
        } catch (e: any) {
            setCompError({ summary: e?.message ?? "Failed to save", fields: [] })
        }
    }

    const handleDeleteComp = async (id: string) => {
        if (!confirm("Delete this competition?")) return
        try { await fetch(`/api/competitions/${id}`, { method: "DELETE", credentials: "include" }); fetchEvents() }
        catch (e) { alert("Delete failed") }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[var(--fg-tertiary)] animate-spin" />
        </div>
    )

    const preview = previewDate(editingEvent?.startDate, editingEvent?.endDate)

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="font-display text-2xl font-bold text-[var(--fg)]">Manage Events</h2>
                <button
                    onClick={() => {
                        setEventError(null)
                        setEditingEvent({ theme: 'red', highlights: [] })
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus size={16} /> New Event
                </button>
            </div>

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-[var(--shadow-lg)]">
                        <h3 className="mb-6 shrink-0 font-display text-xl font-bold text-[var(--fg)]">
                            {editingEvent._id ? "Edit Event" : "Create Event"}
                        </h3>

                        {eventError && (
                            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertCircle size={18} /> {eventError.summary}
                                </div>
                                {eventError.fields.length > 0 && (
                                    <ul className="mt-2 ml-7 list-disc space-y-1 text-xs">
                                        {eventError.fields.map((fe, i) => (
                                            <li key={i}>
                                                <span className="font-medium">{fe.field}:</span> {fe.message}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Event Name"
                                    className={inputClass}
                                    value={editingEvent.name || ""}
                                    onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })}
                                />
                                <select
                                    className={`${inputClass} appearance-none`}
                                    value={editingEvent.theme || "red"}
                                    onChange={e => setEditingEvent({ ...editingEvent, theme: e.target.value })}
                                >
                                    <option value="red">Red Theme</option>
                                    <option value="cyan">Cyan Theme</option>
                                </select>
                            </div>

                            <input
                                placeholder="Tagline"
                                className={inputClass}
                                value={editingEvent.tagline || ""}
                                onChange={e => setEditingEvent({ ...editingEvent, tagline: e.target.value })}
                            />

                            <textarea
                                placeholder="Description"
                                className={`${inputClass} h-24`}
                                value={editingEvent.description || ""}
                                onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            />

                            {/*
                              Two native <input type="date"> pickers. Browsers render a calendar icon
                              inside the field by default; on Chromium/Edge/Firefox/Safari on desktop
                              the whole field is clickable to open the picker.
                            */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                                        <Calendar size={12} /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={editingEvent.startDate || ""}
                                        onChange={e => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
                                        <Calendar size={12} /> End Date
                                    </label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={editingEvent.endDate || ""}
                                        onChange={e => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {preview && (
                                <p className="text-xs text-[var(--fg-tertiary)] -mt-2">
                                    Will display as: <span className="font-medium text-[var(--fg-secondary)]">{preview}</span>
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Location (e.g. MNNIT Allahabad)"
                                    className={inputClass}
                                    value={editingEvent.location || ""}
                                    onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                />
                                <input
                                    placeholder="Participants (e.g. 500+ Engineers)"
                                    className={inputClass}
                                    value={editingEvent.participantsLabel || ""}
                                    onChange={e => setEditingEvent({ ...editingEvent, participantsLabel: e.target.value })}
                                />
                            </div>

                            {/* Highlights — same chip pattern as tech stack */}
                            <div className="border-t border-[var(--border)] pt-4">
                                <label className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                                    <ListChecks size={14} /> Highlights
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(editingEvent.highlights ?? []).map((h, i) => (
                                        <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] text-xs border border-[var(--border)]">
                                            {h}
                                            <button type="button" onClick={() => handleRemoveHighlight(i)} className="hover:text-[var(--fg)] transition-colors"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a highlight..."
                                        className={inputClass}
                                        value={newHighlight}
                                        onChange={(e) => setNewHighlight(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddHighlight() } }}
                                        onBlur={() => handleAddHighlight()}
                                    />
                                    <button onClick={handleAddHighlight} type="button" className="px-4 rounded-xl border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--border-hover)] transition-colors">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                        </div>
                        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg)] pt-4">
                            <button
                                onClick={() => { setEditingEvent(null); setEventError(null) }}
                                className="px-5 py-2.5 rounded-full border border-[var(--border)] text-[var(--fg-secondary)] text-sm font-medium hover:border-[var(--border-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEvent}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-full bg-[var(--fg)] px-6 py-2.5 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Save Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Competition Modal */}
            {editingComp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)]">
                        <h3 className="font-display text-xl font-bold text-[var(--fg)] mb-6">{editingComp._id ? "Edit Competition" : "Add Competition"}</h3>

                        {compError && (
                            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertCircle size={18} /> {compError.summary}
                                </div>
                                {compError.fields.length > 0 && (
                                    <ul className="mt-2 ml-7 list-disc space-y-1 text-xs">
                                        {compError.fields.map((fe, i) => (
                                            <li key={i}><span className="font-medium">{fe.field}:</span> {fe.message}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            <input placeholder="Title" className={inputClass} value={editingComp.title || ""} onChange={e => setEditingComp({ ...editingComp, title: e.target.value })} />
                            <div className="grid grid-cols-3 gap-4">
                                <input placeholder="Type (e.g. Combat)" className={inputClass} value={editingComp.type || ""} onChange={e => setEditingComp({ ...editingComp, type: e.target.value })} />
                                <input type="number" placeholder="Min Members" className={inputClass} value={editingComp.minTeamSize || ""} onChange={e => setEditingComp({ ...editingComp, minTeamSize: parseInt(e.target.value) })} />
                                <input type="number" placeholder="Max Members" className={inputClass} value={editingComp.maxTeamSize || ""} onChange={e => setEditingComp({ ...editingComp, maxTeamSize: parseInt(e.target.value) })} />
                            </div>
                            <textarea placeholder="Description" className={`${inputClass} h-24`} value={editingComp.description || ""} onChange={e => setEditingComp({ ...editingComp, description: e.target.value })} />

                            <div className="border-t border-[var(--border)] pt-4">
                                <label className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                                    <ListChecks size={14} /> Rules
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <input type="text" placeholder="Add a rule..." className={inputClass} value={newRule} onChange={(e) => setNewRule(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())} onBlur={() => handleAddRule()} />
                                    <button onClick={handleAddRule} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--border-hover)] transition-colors" type="button">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {editingComp.rules?.map((rule, idx) => (
                                        <div key={idx} className="flex justify-between items-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-2.5 text-sm text-[var(--fg-secondary)]">
                                            <span>{rule}</span>
                                            <button onClick={() => handleRemoveRule(idx)} className="text-[var(--fg-tertiary)] hover:text-red-500 p-1"><X size={14} /></button>
                                        </div>
                                    ))}
                                    {(!editingComp.rules || editingComp.rules.length === 0) && (
                                        <p className="text-xs text-[var(--fg-tertiary)]">No rules defined yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                                <button onClick={() => { setEditingComp(null); setNewRule(""); setCompError(null) }} className="px-5 py-2.5 rounded-full border border-[var(--border)] text-[var(--fg-secondary)] text-sm font-medium hover:border-[var(--border-hover)] transition-colors">Cancel</button>
                                <button onClick={handleSaveComp} className="px-6 py-2.5 rounded-full bg-[var(--fg)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity">Save Competition</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="space-y-4">
                {events.map(event => (
                    <div key={event._id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
                        <div className="p-5 flex items-center justify-between hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedEvent(expandedEvent === event._id ? null : event._id)}>
                                {expandedEvent === event._id ? <ChevronUp className="w-4 h-4 text-[var(--fg-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--fg-tertiary)]" />}
                                <div>
                                    <h3 className="font-display text-lg font-semibold text-[var(--fg)]">{event.name}</h3>
                                    <div className="flex gap-4 text-xs text-[var(--fg-tertiary)] mt-1">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEventError(null); setEditingEvent(event) }} className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg)] transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteEvent(event._id)} className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-red-500 hover:bg-[var(--bg)] transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedEvent === event._id && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-[var(--border)]">
                                    <div className="p-5">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xs text-[var(--fg-tertiary)] uppercase tracking-wider font-medium">Competitions</h4>
                                            <button onClick={() => { setCompError(null); setEditingComp({ eventId: event._id, minTeamSize: 1, maxTeamSize: 4, rules: [] }) }} className="text-xs flex items-center gap-1 text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">
                                                <Plus size={14} /> Add Competition
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {event.competitions?.map((comp: Competition) => (
                                                <div key={comp._id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-hover)] transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center"><Trophy size={14} className="text-[var(--fg-tertiary)]" /></div>
                                                        <div>
                                                            <p className="font-medium text-[var(--fg)] text-sm">{comp.title}</p>
                                                            <p className="text-xs text-[var(--fg-tertiary)]">{comp.type} · {comp.minTeamSize}-{comp.maxTeamSize} members · {comp.rules?.length || 0} rules</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => { setCompError(null); setEditingComp(comp) }} className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"><Edit2 size={14} /></button>
                                                        <button onClick={() => handleDeleteComp(comp._id!)} className="p-2 rounded-lg text-[var(--fg-tertiary)] hover:text-red-500 hover:bg-[var(--bg-secondary)] transition-colors"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!event.competitions || event.competitions.length === 0) && (
                                                <div className="text-center py-4 text-[var(--fg-tertiary)] text-sm">No competitions added yet.</div>
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
