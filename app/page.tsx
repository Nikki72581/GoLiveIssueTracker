'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'eastfork-assignees'
const DEFAULT_ASSIGNEES = ['Arline', 'Nicole']

type Priority = 'low' | 'medium' | 'high' | 'critical'
type Status = 'open' | 'in-progress' | 'resolved' | 'wont-fix' | 'post-go-live'
type Category = 'data' | 'workflow' | 'configuration' | 'training' | 'integration' | 'other'
type Module = 'financials-banking' | 'distribution' | 'shopify' | 'edi' | 'other-unsure'

interface Issue {
  id: number
  created_at: string
  title: string
  description: string | null
  category: Category
  priority: Priority
  status: Status
  module_area: Module | null
  submitted_by: string
  assigned_to: string | null
  notes: string | null
  resolved_at: string | null
}

const PRIORITY_BADGE: Record<Priority, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-red-400 text-white',
  medium: 'bg-amber-400 text-white',
  low: 'bg-green-500 text-white',
}

const STATUS_BADGE: Record<Status, string> = {
  open: 'bg-blue-500 text-white',
  'in-progress': 'bg-violet-500 text-white',
  resolved: 'bg-emerald-500 text-white',
  'wont-fix': 'bg-slate-500 text-white',
  'post-go-live': 'bg-teal-500 text-white',
}

const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  'wont-fix': "Won't Fix",
  'post-go-live': 'Post Go-Live',
}

const CATEGORY_BADGE: Record<Category, string> = {
  data: 'bg-cyan-100 text-cyan-700',
  workflow: 'bg-indigo-100 text-indigo-700',
  configuration: 'bg-purple-100 text-purple-700',
  training: 'bg-teal-100 text-teal-700',
  integration: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-500',
}

const MODULE_BADGE: Record<Module, string> = {
  'financials-banking': 'bg-green-100 text-green-700',
  distribution: 'bg-orange-100 text-orange-700',
  shopify: 'bg-lime-100 text-lime-700',
  edi: 'bg-blue-100 text-blue-700',
  'other-unsure': 'bg-slate-100 text-slate-500',
}

const MODULE_LABELS: Record<Module, string> = {
  'financials-banking': 'Financials/Banking',
  distribution: 'Distribution',
  shopify: 'Shopify',
  edi: 'EDI',
  'other-unsure': 'Other/Unsure',
}

const MODULES: Module[] = ['financials-banking', 'distribution', 'shopify', 'edi', 'other-unsure']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${className}`}>
      {children}
    </span>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ConfirmModal({ title, message, onConfirm, onCancel, loading }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
        <h3 className="text-slate-900 font-semibold text-base mb-1">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors">
            {loading ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignToInput({ value, onChange, assignees, listId, className }: {
  value: string; onChange: (val: string) => void; assignees: string[]; listId: string; className?: string
}) {
  return (
    <>
      <input list={listId} value={value} onChange={(e) => onChange(e.target.value)} className={className} placeholder="Type a name…" autoComplete="off" />
      <datalist id={listId}>
        {assignees.map((a) => <option key={a} value={a} />)}
      </datalist>
    </>
  )
}

function IssueRow({ issue, onUpdate, onDelete, assignees, onAddAssignee }: {
  issue: Issue
  onUpdate: (updated: Issue) => void
  onDelete: (id: number) => void
  assignees: string[]
  onAddAssignee: (name: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editStatus, setEditStatus] = useState<Status>(issue.status)
  const [editAssigned, setEditAssigned] = useState(issue.assigned_to ?? '')
  const [editNotes, setEditNotes] = useState(issue.notes ?? '')
  const [editDescription, setEditDescription] = useState(issue.description ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/issue/${issue.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) onDelete(issue.id)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/issue/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          assigned_to: editAssigned || null,
          notes: editNotes || null,
          description: editDescription || null,
        }),
      })
      if (res.ok) {
        const updated: Issue = await res.json()
        if (editAssigned.trim()) onAddAssignee(editAssigned.trim())
        onUpdate(updated)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setEditing(false)
    setEditStatus(issue.status)
    setEditAssigned(issue.assigned_to ?? '')
    setEditNotes(issue.notes ?? '')
    setEditDescription(issue.description ?? '')
  }

  function truncateDesc(text: string | null) {
    if (!text) return null
    return text.length > 80 ? text.slice(0, 80) + '…' : text
  }

  const selectClass = 'w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]/20 transition-colors'
  const isInactive = issue.status === 'resolved' || issue.status === 'wont-fix'

  return (
    <>
      {confirmDelete && (
        <ConfirmModal
          title="Delete issue?"
          message={`"${issue.title}" will be permanently removed and cannot be recovered.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
      <tr
        className={`border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors group ${isInactive ? 'opacity-55' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3.5 text-sm text-slate-400 font-mono whitespace-nowrap">#{issue.id}</td>
        <td className="px-4 py-3.5 min-w-[180px]">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{issue.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{issue.submitted_by}</p>
        </td>
        <td className="px-4 py-3.5 max-w-[220px]">
          <span className="text-sm text-slate-400 line-clamp-2">
            {truncateDesc(issue.description) ?? <span className="text-slate-300">—</span>}
          </span>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <Badge className={STATUS_BADGE[issue.status]}>{STATUS_LABELS[issue.status]}</Badge>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <Badge className={PRIORITY_BADGE[issue.priority]}>{cap(issue.priority)}</Badge>
        </td>
        <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">{cap(issue.category)}</td>
        <td className="px-4 py-3.5 text-sm text-slate-400 whitespace-nowrap">{formatDate(issue.created_at)}</td>
        <td className="px-4 py-3.5 text-sm text-slate-500">
          {issue.assigned_to ?? <span className="text-slate-300">Unassigned</span>}
        </td>
        <td className="px-4 py-3.5 w-10">
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="p-1.5 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete issue"
          >
            <TrashIcon />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-slate-50/60 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={CATEGORY_BADGE[issue.category]}>{cap(issue.category)}</Badge>
                {issue.module_area && (
                  <Badge className={MODULE_BADGE[issue.module_area]}>{MODULE_LABELS[issue.module_area]}</Badge>
                )}
              </div>

              {issue.description && (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-4 max-w-2xl">
                  {issue.description}
                </p>
              )}

              {issue.notes && !editing && (
                <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 mb-4 max-w-2xl">
                  <p className="font-mono text-[9px] text-sky-600 uppercase tracking-widest mb-1.5 font-semibold">Team Notes</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{issue.notes}</p>
                </div>
              )}

              {issue.resolved_at && (
                <p className="font-mono text-[10px] text-emerald-600 font-semibold mb-3">
                  ✓ Resolved {formatDate(issue.resolved_at)}
                </p>
              )}

              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="font-mono text-[10px] uppercase tracking-wider text-[#00aeef] hover:text-[#0090cc] border border-[#00aeef]/30 hover:border-[#00aeef]/60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Update status / notes ↓
                </button>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 max-w-2xl">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">Description</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} className={`${selectClass} resize-y`} placeholder="Describe the issue…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Status)} className={selectClass}>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="wont-fix">Won&apos;t Fix</option>
                        <option value="post-go-live">Post Go-Live Task</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">Assign To</label>
                      <AssignToInput value={editAssigned} onChange={setEditAssigned} assignees={assignees} listId={`assignees-row-${issue.id}`} className={selectClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">Notes</label>
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className={`${selectClass} resize-none`} placeholder="Add team notes…" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={saving} className="bg-[#00aeef] hover:bg-[#0090cc] disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-lg transition-colors shadow-sm">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'wont-fix', label: "Won't Fix" },
  { value: 'post-go-live', label: 'Post Go-Live' },
]

const CATEGORIES: Category[] = ['data', 'workflow', 'configuration', 'training', 'integration', 'other']
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical']

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [assignees, setAssignees] = useState<string[]>(DEFAULT_ASSIGNEES)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed) && parsed.length > 0) setAssignees(parsed)
      } catch {}
    }
  }, [])

  function addAssignee(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setAssignees((prev) => {
      if (prev.some((a) => a.toLowerCase() === trimmed.toLowerCase())) return prev
      const updated = [...prev, trimmed]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const [form, setForm] = useState({
    title: '',
    description: '',
    submitted_by: '',
    category: 'data',
    priority: 'medium',
    module_area: 'other-unsure',
    assigned_to: '',
  })

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/issues')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setIssues(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch issues:', err)
      setIssues([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIssues() }, [fetchIssues])

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false
    return true
  })

  const stats = {
    open: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in-progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    critical: issues.filter((i) => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'wont-fix').length,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, assigned_to: form.assigned_to || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error (${res.status})`)
      }
      const newIssue: Issue = await res.json()
      if (form.assigned_to.trim()) addAssignee(form.assigned_to.trim())
      setIssues((prev) => [newIssue, ...prev])
      setForm({ title: '', description: '', submitted_by: '', category: 'data', priority: 'medium', module_area: 'other-unsure', assigned_to: '' })
      setFormOpen(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleUpdate(updated: Issue) {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  function handleDelete(id: number) {
    setIssues((prev) => prev.filter((i) => i.id !== id))
  }

  const inputClass = 'w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]/20 transition-colors placeholder-slate-300'
  const labelClass = 'block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold'

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] mb-1.5 font-semibold text-[#00aeef]">
              Stellar One
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
              EastFork Go-Live Tracker
            </h1>
            <p className="text-slate-400 text-sm">Track and manage issues during go-live.</p>
          </div>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <div className="hidden sm:flex gap-2">
              {[
                { label: 'Open', value: stats.open, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'In Progress', value: stats.inProgress, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Critical', value: stats.critical, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2 text-center min-w-[56px]`}>
                  <div className={`font-bold text-lg leading-none ${s.color}`}>{s.value}</div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-slate-400 mt-1 whitespace-nowrap">{s.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setFormOpen((v) => !v); setSubmitError(null) }}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
                formOpen
                  ? 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200'
              }`}
            >
              {formOpen ? '✕  Cancel' : '+ Log Issue'}
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Submit form */}
        {formOpen && (
          <div className="mb-6">
            <form onSubmit={handleSubmit} className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">New Issue</h2>
              <div>
                <label className={labelClass}>Title *</label>
                <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Brief description of the issue" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={5}
                  className={`${inputClass} resize-y`}
                  placeholder="What happened? Which screen or record was affected? What error appeared? Steps to reproduce if known."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your Name *</label>
                  <input required value={form.submitted_by} onChange={(e) => setForm((p) => ({ ...p, submitted_by: e.target.value }))} className={inputClass} placeholder="Full name" />
                </div>
                <div>
                  <label className={labelClass}>Assign To</label>
                  <AssignToInput value={form.assigned_to} onChange={(val) => setForm((p) => ({ ...p, assigned_to: val }))} assignees={assignees} listId="assignees-form" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Category *</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputClass}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority *</label>
                  <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className={inputClass}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Module / Area</label>
                  <select value={form.module_area} onChange={(e) => setForm((p) => ({ ...p, module_area: e.target.value }))} className={inputClass}>
                    {MODULES.map((m) => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
                  </select>
                </div>
              </div>
              {submitError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
              )}
              <div className="flex justify-end pt-1">
                <button type="submit" disabled={submitting} className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-green-200">
                  {submitting ? 'Submitting…' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`font-mono text-[9px] uppercase tracking-wider px-3 py-2 transition-colors whitespace-nowrap ${
                  statusFilter === tab.value ? 'bg-[#00aeef] text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-500 font-mono text-[9px] uppercase tracking-wider rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-[#00aeef]"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}
          </select>
          {!loading && (
            <span className="text-slate-300 text-sm ml-1">
              {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'}
            </span>
          )}
          <button onClick={fetchIssues} className="ml-auto font-mono text-[9px] uppercase tracking-wider text-slate-400 hover:text-[#00aeef] transition-colors">
            ↻ Refresh
          </button>
        </div>

        {/* Issues table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">Loading issues…</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-slate-200 text-5xl mb-4 select-none">◌</div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">No issues match the current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['#', 'Title', 'Description', 'Status', 'Priority', 'Category', 'Created', 'Assigned To', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-widest text-slate-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      assignees={assignees}
                      onAddAssignee={addAssignee}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-100">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-300 text-center">
            EastFork · Stellar One · Powered by Acumatica
          </p>
        </footer>
      </div>
    </div>
  )
}
