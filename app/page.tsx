'use client'

import { useState, useEffect, useCallback } from 'react'

const STELLAR_TEAM = ['Arline', 'Nicole']

type Priority = 'low' | 'medium' | 'high' | 'critical'
type Status = 'open' | 'in-progress' | 'resolved' | 'wont-fix'
type Category = 'data' | 'workflow' | 'configuration' | 'training' | 'integration' | 'other'

interface Issue {
  id: number
  created_at: string
  title: string
  description: string | null
  category: Category
  priority: Priority
  status: Status
  submitted_by: string
  assigned_to: string | null
  notes: string | null
  resolved_at: string | null
}

const PRIORITY_BORDER: Record<Priority, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-slate-600',
}

const PRIORITY_BADGE: Record<Priority, string> = {
  critical: 'bg-red-950/60 text-red-400 border-red-800/50',
  high: 'bg-orange-950/60 text-orange-400 border-orange-800/50',
  medium: 'bg-yellow-950/60 text-yellow-500 border-yellow-800/50',
  low: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
}

const STATUS_BADGE: Record<Status, string> = {
  open: 'bg-blue-950/60 text-blue-400 border-blue-800/50',
  'in-progress': 'bg-violet-950/60 text-violet-400 border-violet-800/50',
  resolved: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
  'wont-fix': 'bg-slate-800/60 text-slate-400 border-slate-700/50',
}

const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  'wont-fix': "Won't Fix",
}

const CATEGORY_BADGE: Record<Category, string> = {
  data: 'bg-cyan-950/60 text-cyan-400 border-cyan-900/50',
  workflow: 'bg-indigo-950/60 text-indigo-400 border-indigo-900/50',
  configuration: 'bg-purple-950/60 text-purple-400 border-purple-900/50',
  training: 'bg-teal-950/60 text-teal-400 border-teal-900/50',
  integration: 'bg-pink-950/60 text-pink-400 border-pink-900/50',
  other: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${className}`}
    >
      {children}
    </span>
  )
}

function IssueCard({ issue, onUpdate }: { issue: Issue; onUpdate: (updated: Issue) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editStatus, setEditStatus] = useState<Status>(issue.status)
  const [editAssigned, setEditAssigned] = useState(issue.assigned_to ?? '')
  const [editNotes, setEditNotes] = useState(issue.notes ?? '')
  const [saving, setSaving] = useState(false)

  const isInactive = issue.status === 'resolved' || issue.status === 'wont-fix'

  const selectClass =
    'w-full bg-[#070a12] border border-[#1c2a42] text-[#c0cce8] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#3060a0] transition-colors'

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
        }),
      })
      if (res.ok) {
        const updated: Issue = await res.json()
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
  }

  return (
    <div
      className={`border-l-4 ${PRIORITY_BORDER[issue.priority]} bg-[#0d1525] border border-[#1c2a42] rounded-r-xl transition-opacity duration-200 ${
        isInactive ? 'opacity-60' : 'opacity-100'
      }`}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 hover:bg-white/[0.015] transition-colors rounded-r-xl"
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <Badge className={PRIORITY_BADGE[issue.priority]}>{issue.priority}</Badge>
          <Badge className={STATUS_BADGE[issue.status]}>{STATUS_LABELS[issue.status]}</Badge>
          <Badge className={CATEGORY_BADGE[issue.category]}>{issue.category}</Badge>
        </div>
        <p className="text-[#c0cce8] font-medium text-[13px] leading-snug mb-2">{issue.title}</p>
        <div className="font-mono text-[10px] text-[#3d5580] flex flex-wrap gap-x-1.5 items-center">
          <span>#{issue.id}</span>
          <span className="text-[#1e2e48]">·</span>
          <span>{formatDate(issue.created_at)}</span>
          <span className="text-[#1e2e48]">·</span>
          <span>{issue.submitted_by}</span>
          {issue.assigned_to && (
            <>
              <span className="text-[#1e2e48]">·</span>
              <span className="text-[#5070a0]">→ {issue.assigned_to}</span>
            </>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#141e30]">
          {issue.description && (
            <p className="text-[#7a8cac] text-[13px] leading-relaxed mt-3">{issue.description}</p>
          )}

          {issue.notes && (
            <div className="mt-3 bg-[#080e1a] border border-[#1a2538] rounded-lg p-3">
              <p className="font-mono text-[9px] text-[#3d5580] uppercase tracking-widest mb-1.5">
                Team Notes
              </p>
              <p className="text-[#7a8cac] text-[13px] leading-relaxed">{issue.notes}</p>
            </div>
          )}

          {issue.resolved_at && (
            <p className="mt-3 font-mono text-[10px] text-emerald-600">
              ✓ Resolved {formatDate(issue.resolved_at)}
            </p>
          )}

          <div className="mt-4">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="font-mono text-[10px] uppercase tracking-wider text-[#3d5a8a] hover:text-[#6080b8] border border-[#1c2e4a] hover:border-[#2a4070] px-3 py-1.5 rounded-lg transition-colors"
              >
                Update status / notes ↓
              </button>
            ) : (
              <div className="bg-[#080e1a] border border-[#1a2538] rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-[#3d5580] mb-1.5">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Status)}
                      className={selectClass}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="wont-fix">Won&apos;t Fix</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-[#3d5580] mb-1.5">
                      Assign To
                    </label>
                    <select
                      value={editAssigned}
                      onChange={(e) => setEditAssigned(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {STELLAR_TEAM.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-[#3d5580] mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className={`${selectClass} resize-none`}
                    placeholder="Add team notes…"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider px-5 py-2 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="font-mono text-[10px] uppercase tracking-wider text-[#4a5f80] hover:text-[#7a8cac] px-3 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'wont-fix', label: "Won't Fix" },
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
  const [form, setForm] = useState({
    title: '',
    description: '',
    submitted_by: '',
    category: 'data',
    priority: 'medium',
    assigned_to: '',
  })

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/issues')
      const data = await res.json()
      setIssues(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false
    return true
  })

  const stats = {
    open: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in-progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    critical: issues.filter(
      (i) => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'wont-fix'
    ).length,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, assigned_to: form.assigned_to || null }),
      })
      if (res.ok) {
        const newIssue: Issue = await res.json()
        setIssues((prev) => [newIssue, ...prev])
        setForm({
          title: '',
          description: '',
          submitted_by: '',
          category: 'data',
          priority: 'medium',
          assigned_to: '',
        })
        setFormOpen(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleUpdate(updated: Issue) {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  const inputClass =
    'w-full bg-[#070a12] border border-[#1c2a42] text-[#c0cce8] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#3060a0] transition-colors placeholder-[#2a3a54]'
  const labelClass =
    'block font-mono text-[9px] uppercase tracking-widest text-[#3d5580] mb-1.5'

  function cap(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <div className="min-h-screen bg-[#060810] text-[#c0cce8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a3a58] mb-2">
            Stellar One
          </p>
          <h1 className="font-display text-2xl sm:text-[2rem] font-bold text-white tracking-tight leading-none mb-2">
            EastFork Go-Live Tracker
          </h1>
          <p className="text-[#4a6080] text-sm">
            Log issues, track progress, and stay aligned through go-live.
          </p>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-8">
          {[
            { label: 'Open', value: stats.open, color: 'text-blue-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-violet-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
            { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#0d1525] border border-[#1c2a42] rounded-xl p-3 text-center"
            >
              <div className={`font-mono text-2xl font-bold leading-none ${s.color}`}>{s.value}</div>
              <div className="font-mono text-[8px] uppercase tracking-widest text-[#3d5580] mt-1.5 leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Submit form */}
        <div className="mb-8">
          <button
            onClick={() => setFormOpen((v) => !v)}
            className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all duration-150 ${
              formOpen
                ? 'bg-transparent text-[#4a6080] border-[#1c2a42] hover:border-[#2a3a54]'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-lg shadow-blue-900/30'
            }`}
          >
            {formOpen ? '✕  Cancel' : '+  Log Issue'}
          </button>

          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="mt-4 bg-[#0d1525] border border-[#1c2a42] rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className={inputClass}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Steps to reproduce, impact, context…"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your Name *</label>
                  <input
                    required
                    value={form.submitted_by}
                    onChange={(e) => setForm((p) => ({ ...p, submitted_by: e.target.value }))}
                    className={inputClass}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Assign To</label>
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {STELLAR_TEAM.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {cap(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                    className={inputClass}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {cap(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/30"
                >
                  {submitting ? 'Submitting…' : 'Submit Issue'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
          <div className="flex bg-[#0d1525] border border-[#1c2a42] rounded-xl overflow-hidden">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`font-mono text-[9px] uppercase tracking-wider px-3 py-2 transition-colors whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-[#4a6080] hover:text-[#8899bb]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0d1525] border border-[#1c2a42] text-[#6a80a0] font-mono text-[9px] uppercase tracking-wider rounded-xl px-3 py-2 focus:outline-none focus:border-[#2a3a54]"
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {cap(p)}
              </option>
            ))}
          </select>

          <button
            onClick={fetchIssues}
            className="ml-auto font-mono text-[9px] uppercase tracking-wider text-[#3d5580] hover:text-[#6a80a0] transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Issue list */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-20 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#3d5580] animate-pulse">
                Loading issues…
              </p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-16 bg-[#0d1525] border border-[#1c2a42] rounded-2xl text-center">
              <div className="text-[#1c2a42] text-5xl mb-4 select-none">◌</div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#3d5580]">
                No issues match the current filters
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onUpdate={handleUpdate} />
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-[#111b2c]">
          <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#2a3a54] text-center">
            EastFork · Stellar One · Powered by Acumatica
          </p>
        </footer>
      </div>
    </div>
  )
}
