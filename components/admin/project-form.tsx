"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, X, Save, Layout, Cpu,
  Users, FileText, Link as LinkIcon,
  Github, ExternalLink, Image as ImageIcon,
  Eye, EyeOff, Terminal, AlertCircle
} from "lucide-react"
import ReactMarkdown from "react-markdown"

// --- Custom UI Components for the "Tech" Look ---

const TechInput = ({ label, ...props }: any) => (
  <div className="group">
    {label && <label className="block text-xs font-mono text-[#00D4FF] mb-2 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-focus-within:border-[#E55B5B] transition-colors pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-focus-within:border-[#E55B5B] transition-colors pointer-events-none" />

      <input
        {...props}
        className="w-full bg-black/40 border-b border-white/10 text-white px-4 py-3 focus:outline-none focus:border-[#E55B5B] focus:bg-black/60 transition-all placeholder:text-neutral-600"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
      />
    </div>
  </div>
)

const TechTextArea = ({ label, ...props }: any) => (
  <div className="group">
    {label && <label className="block text-xs font-mono text-[#00D4FF] mb-2 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-focus-within:border-[#E55B5B] transition-colors pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-focus-within:border-[#E55B5B] transition-colors pointer-events-none" />

      <textarea
        {...props}
        className="w-full bg-black/40 border-b border-white/10 text-white px-4 py-3 focus:outline-none focus:border-[#E55B5B] focus:bg-black/60 transition-all placeholder:text-neutral-600 min-h-[120px]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
      />
    </div>
  </div>
)

// --- Main Form Component ---

export function ProjectForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState("basic")
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    shortDescription: initialData?.shortDescription || "",
    category: initialData?.category || "Innovation",
    image: initialData?.image || "",
    featured: initialData?.featured || false,
    published: initialData?.published || false,
    hardwareUsed: initialData?.hardwareUsed || [],
    softwareUsed: initialData?.softwareUsed || [],
    techStack: initialData?.techStack || [],
    contributors: initialData?.contributors || [],
    mentors: initialData?.mentors || [],
    content: initialData?.content || "",
    achievements: initialData?.achievements || [],
    links: initialData?.links || { github: "", documentation: "", demo: "" },
  })

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name.startsWith('links.')) {
      const linkField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        links: { ...prev.links, [linkField]: value }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }))
    }
  }

  const addArrayItem = (field: string, item: string) => {
    if (!item.trim()) return
    setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], item] }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev, [field]: prev[field].filter((_: any, i: number) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = initialData ? `/api/projects/${initialData._id}` : "/api/projects"
      const response = await fetch(url, {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to sync with database.")
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Render Helpers ---

  const sections = [
    { id: "basic", label: "Core Data", icon: Layout },
    { id: "details", label: "Tech Stack", icon: Cpu },
    { id: "team", label: "Personnel", icon: Users },
    { id: "links", label: "Connections", icon: LinkIcon },
    { id: "content", label: "Documentation", icon: FileText },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* --- Tab Navigation --- */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-1">
        {sections.map((sec) => {
          const Icon = sec.icon
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative overflow-hidden group ${isActive ? "text-black" : "text-neutral-500 hover:text-white"
                }`}
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-[#00D4FF]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {/* Border for inactive */}
              {!isActive && <div className="absolute inset-0 border border-white/10 group-hover:border-white/30 transition-colors" />}

              <span className="relative z-10 flex items-center gap-2">
                <Icon size={16} /> {sec.label}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 min-h-[400px]">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        {/* --- SECTION: BASIC INFO --- */}
        {activeSection === "basic" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TechInput name="title" value={formData.title} onChange={handleInputChange} label="Project Title" placeholder="e.g. Autonomous Drone" required />

              <div className="group">
                <label className="block text-xs font-mono text-[#00D4FF] mb-2 uppercase tracking-wider">Classification</label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-black/40 border-b border-white/10 text-white px-4 py-3 focus:outline-none focus:border-[#E55B5B] transition-all appearance-none"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
                  >
                    <option value="Innovation">Innovation</option>
                    <option value="Competition">Competition</option>
                    <option value="Research">Research</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">▼</div>
                </div>
              </div>
            </div>

            <TechInput name="shortDescription" value={formData.shortDescription} onChange={handleInputChange} label="Short Brief" placeholder="One liner for cards..." required />
            <TechTextArea name="description" value={formData.description} onChange={handleInputChange} label="Full Abstract" placeholder="Detailed summary..." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <TechInput name="image" value={formData.image} onChange={handleInputChange} label="Cover Image URL" placeholder="https://..." />
                <div className="flex gap-6 mt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${formData.published ? "bg-green-500 border-green-500" : "border-white/30"}`}>
                      {formData.published && <span className="text-black font-bold text-xs">✓</span>}
                    </div>
                    <input type="checkbox" name="published" checked={formData.published} onChange={handleInputChange} className="hidden" />
                    <span className="text-sm font-mono uppercase text-neutral-300 group-hover:text-white">Publish to Live</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${formData.featured ? "bg-yellow-500 border-yellow-500" : "border-white/30"}`}>
                      {formData.featured && <span className="text-black font-bold text-xs">✓</span>}
                    </div>
                    <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="hidden" />
                    <span className="text-sm font-mono uppercase text-neutral-300 group-hover:text-white">Mark Featured</span>
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              <div className="aspect-video bg-neutral-900 border border-white/10 rounded-lg overflow-hidden relative flex items-center justify-center">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-600">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-mono">NO_SIGNAL</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur text-[10px] font-mono text-white">PREVIEW</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SECTION: TECH STACK --- */}
        {activeSection === "details" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {[
              { key: "techStack", label: "Core Technologies" },
              { key: "hardwareUsed", label: "Hardware Manifest" },
              { key: "softwareUsed", label: "Software Modules" }
            ].map((section) => (
              <div key={section.key} className="bg-white/5 border border-white/5 p-6 rounded-lg">
                <label className="block text-xs font-mono text-[#00D4FF] mb-4 uppercase tracking-wider">{section.label}</label>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(formData as any)[section.key].map((item: string, i: number) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-xs font-mono rounded-sm">
                      {item}
                      <button type="button" onClick={() => removeArrayItem(section.key, i)} className="hover:text-white transition-colors"><X size={12} /></button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type and press Enter..."
                    className="flex-1 bg-black border border-white/10 px-4 py-2 text-sm text-white focus:border-[#E55B5B] outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem(section.key, (e.target as any).value);
                        (e.target as any).value = ""
                      }
                    }}
                  />
                  <div className="px-4 py-2 bg-neutral-800 text-neutral-500 text-xs font-mono flex items-center">⏎ ENTER</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* --- SECTION: TEAM --- */}
        {activeSection === "team" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-neutral-900/50 border border-white/10 p-6">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-[#E55B5B]" /> Contributors</h4>
              <div className="space-y-3 mb-4">
                {formData.contributors.map((c: any, i: any) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="Name" value={c.name}
                      className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#00D4FF] outline-none"
                      onChange={(e) => { const items = [...formData.contributors]; (items[i] as any).name = e.target.value; setFormData({ ...formData, contributors: items }) }}
                    />
                    <input
                      placeholder="Role (e.g. Lead)" value={c.role}
                      className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#00D4FF] outline-none"
                      onChange={(e) => { const items = [...formData.contributors]; (items[i] as any).role = e.target.value; setFormData({ ...formData, contributors: items }) }}
                    />
                    <button type="button" onClick={() => removeArrayItem("contributors", i)} className="p-2 text-neutral-500 hover:text-[#E55B5B]"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, contributors: [...formData.contributors, { name: "", role: "" }] })} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-2 text-[#00D4FF] flex items-center gap-2 transition-colors">
                <Plus size={14} /> ADD_MEMBER
              </button>
            </div>

            <div className="bg-neutral-900/50 border border-white/10 p-6">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-yellow-500" /> Mentors</h4>
              <div className="space-y-3 mb-4">
                {formData.mentors.map((c: any, i: any) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="Name" value={c.name}
                      className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      onChange={(e) => { const items = [...formData.mentors]; (items[i] as any).name = e.target.value; setFormData({ ...formData, mentors: items }) }}
                    />
                    <input
                      placeholder="Role (e.g. Faculty Advisor)" value={c.role}
                      className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      onChange={(e) => { const items = [...formData.mentors]; (items[i] as any).role = e.target.value; setFormData({ ...formData, mentors: items }) }}
                    />
                    <button type="button" onClick={() => removeArrayItem("mentors", i)} className="p-2 text-neutral-500 hover:text-[#E55B5B]"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, mentors: [...formData.mentors, { name: "", role: "" }] })} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-2 text-yellow-500 flex items-center gap-2 transition-colors">
                <Plus size={14} /> ADD_MENTOR
              </button>
            </div>
          </motion.div>
        )}

        {/* --- SECTION: LINKS (FIXED) --- */}
        {activeSection === "links" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="p-6 border border-white/10 bg-neutral-900/30 rounded-lg space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white"><Github size={20} /></div>
                <div className="flex-1">
                  <label className="block text-xs font-mono text-neutral-400 mb-1">GITHUB_REPO</label>
                  <input
                    name="links.github"
                    value={formData.links.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/..."
                    className="w-full bg-black border border-white/10 p-2 text-white text-sm focus:border-[#00D4FF] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white"><ExternalLink size={20} /></div>
                <div className="flex-1">
                  <label className="block text-xs font-mono text-neutral-400 mb-1">LIVE_DEMO</label>
                  <input
                    name="links.demo"
                    value={formData.links.demo}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full bg-black border border-white/10 p-2 text-white text-sm focus:border-[#00D4FF] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white"><FileText size={20} /></div>
                <div className="flex-1">
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DOCUMENTATION</label>
                  <input
                    name="links.documentation"
                    value={formData.links.documentation}
                    onChange={handleInputChange}
                    placeholder="https://docs..."
                    className="w-full bg-black border border-white/10 p-2 text-white text-sm focus:border-[#00D4FF] outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SECTION: CONTENT (With Preview) --- */}
        {activeSection === "content" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono text-[#E55B5B] uppercase tracking-wider">Detailed Documentation (Markdown)</label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-xs font-bold uppercase px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                {showPreview ? <><EyeOff size={14} /> Edit Mode</> : <><Eye size={14} /> Preview Mode</>}
              </button>
            </div>

            {showPreview ? (
              <div className="w-full p-6 bg-black/40 border border-white/10 rounded min-h-[400px] prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{formData.content || "*No content entered yet...*"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="# Introduction\n\nDescribe the project architecture..."
                className="w-full p-6 bg-black/40 border border-white/10 text-white min-h-[400px] font-mono text-sm leading-relaxed focus:border-[#E55B5B] outline-none resize-y"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)" }}
              />
            )}
          </motion.div>
        )}

        {/* --- Footer Action Bar --- */}
        <div className="fixed bottom-0 left-0 w-full bg-neutral-900/90 backdrop-blur border-t border-white/10 p-4 z-40">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="text-xs text-neutral-500 font-mono hidden md:block">
              {isSubmitting ? "SYNCING_WITH_MAINFRAME..." : "SYSTEM_READY_FOR_INPUT"}
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button type="button" onClick={() => window.history.back()} className="px-6 py-3 border border-white/10 text-white hover:bg-white/5 transition-colors font-mono text-sm uppercase">Cancel</button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 md:flex-none px-8 py-3 bg-[#E55B5B] text-white font-bold uppercase tracking-widest hover:bg-[#ff6b6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)" }}
              >
                {isSubmitting ? <span className="animate-pulse">Processing...</span> : <><Save size={18} /> Save Project</>}
              </button>
            </div>
          </div>
        </div>

        {/* Spacer for fixed footer */}
        <div className="h-20" />
      </form>
    </div>
  )
}