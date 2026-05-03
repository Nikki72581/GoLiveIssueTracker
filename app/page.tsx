'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

// Left border color per priority
const PRIORITY_BORDER: Record<Priority, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-400',
  low: 'border-l-slate-300',
}

// Badge: background + text + border
const PRIORITY_BADGE: Record<Priority, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-500 border-slate-200',
}

const STATUS_BADGE: Record<Status, string> = {
  open: 'bg-sky-50 text-sky-700 border-sky-200',
  'in-progress': 'bg-violet-50 text-violet-700 border-violet-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'wont-fix': 'bg-slate-100 text-slate-500 border-slate-200',
  'post-go-live': 'bg-teal-50 text-teal-700 border-teal-200',
}

const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  'wont-fix': "Won't Fix",
  'post-go-live': 'Post Go-Live',
}

const CATEGORY_BADGE: Record<Category, string> = {
  data: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  workflow: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  configuration: 'bg-purple-50 text-purple-700 border-purple-200',
  training: 'bg-teal-50 text-teal-700 border-teal-200',
  integration: 'bg-pink-50 text-pink-700 border-pink-200',
  other: 'bg-slate-100 text-slate-500 border-slate-200',
}

const MODULE_BADGE: Record<Module, string> = {
  'financials-banking': 'bg-green-50 text-green-700 border-green-200',
  distribution: 'bg-orange-50 text-orange-700 border-orange-200',
  shopify: 'bg-lime-50 text-lime-700 border-lime-200',
  edi: 'bg-blue-50 text-blue-700 border-blue-200',
  'other-unsure': 'bg-slate-100 text-slate-500 border-slate-200',
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

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${className}`}
    >
      {children}
    </span>
  )
}

function MarkdownEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [preview, setPreview] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  function wrap(before: string, after: string, placeholder: string) {
    const ta = ref.current
    if (!ta) return
    const s = ta.selectionStart
    const e = ta.selectionEnd
    const sel = value.slice(s, e) || placeholder
    const next = value.slice(0, s) + before + sel + after + value.slice(e)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(s + before.length, s + before.length + sel.length)
    })
  }

  function insertLine(prefix: string) {
    const ta = ref.current
    if (!ta) return
    const s = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', s - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(s + prefix.length, s + prefix.length)
    })
  }

  const toolBtn = 'px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors'

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#00aeef] focus-within:ring-1 focus-within:ring-[#00aeef]/20 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-100 flex-wrap">
        <button type="button" onClick={() => wrap('**', '**', 'bold text')} className={`${toolBtn} font-bold`} title="Bold">B</button>
        <button type="button" onClick={() => wrap('*', '*', 'italic text')} className={`${toolBtn} italic`} title="Italic">I</button>
        <button type="button" onClick={() => wrap('`', '`', 'code')} className={`${toolBtn} font-mono text-[11px]`} title="Inline code">&lt;/&gt;</button>
        <span className="w-px h-4 bg-slate-200 mx-1" />
        <button type="button" onClick={() => insertLine('## ')} className={toolBtn} title="Heading">H2</button>
        <button type="button" onClick={() => insertLine('- ')} className={toolBtn} title="Bullet list">• List</button>
        <button type="button" onClick={() => insertLine('1. ')} className={toolBtn} title="Numbered list"># List</button>
        <span className="w-px h-4 bg-slate-200 mx-1" />
        <button type="button" onClick={() => wrap('[', '](https://)', 'link text')} className={toolBtn} title="Link">Link</button>
        <button type="button" onClick={() => wrap('![', '](https://)', 'image description')} className={toolBtn} title="Image URL">Image</button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded border transition-colors ${
              preview
                ? 'bg-[#00aeef] text-white border-transparent'
                : 'text-slate-400 border-slate-200 hover:border-[#00aeef] hover:text-[#00aeef]'
            }`}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {preview ? (
        <div className="px-4 py-3 min-h-[200px] bg-white prose prose-sm max-w-none prose-img:rounded-lg prose-img:max-h-96 prose-a:text-[#00aeef]">
          {value.trim()
            ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            : <span className="text-slate-300 text-sm italic">Nothing to preview yet.</span>
          }
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={9}
          className="w-full px-3 py-3 text-sm text-slate-800 bg-white resize-y focus:outline-none placeholder-slate-300 leading-relaxed"
          placeholder={`Describe the issue in as much detail as possible.\n\nInclude:\n• Exact steps to reproduce the problem\n• Affected records, accounts, or data\n• Expected behavior vs. what actually happened\n• Any error messages you see\n\nTo add an image, use: ![description](paste-image-url-here)`}
        />
      )}
    </div>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
        <h3 className="text-slate-900 font-semibold text-base mb-1">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
          >
            {loading ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignToInput({
  value,
  onChange,
  assignees,
  listId,
  className,
}: {
  value: string
  onChange: (val: string) => void
  assignees: string[]
  listId: string
  className?: string
}) {
  return (
    <>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder="Type a name…"
        autoComplete="off"
      />
      <datalist id={listId}>
        {assignees.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </>
  )
}

function IssueCard({
  issue,
  onUpdate,
  onDelete,
  assignees,
  onAddAssignee,
}: {
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
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/issue/${issue.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        onDelete(issue.id)
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const isInactive = issue.status === 'resolved' || issue.status === 'wont-fix'

  const selectClass =
    'w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]/20 transition-colors'

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
  }

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
    <div
      className={`border-l-4 ${PRIORITY_BORDER[issue.priority]} bg-white border border-slate-200 rounded-r-xl shadow-sm transition-opacity duration-200 ${
        isInactive ? 'opacity-60' : 'opacity-100'
      }`}
    >
      {/* Collapsed header */}
      <div className="relative group">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left p-4 hover:bg-slate-50 transition-colors rounded-r-xl pr-10"
          aria-expanded={expanded}
        >
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            <Badge className={PRIORITY_BADGE[issue.priority]}>{issue.priority}</Badge>
            <Badge className={STATUS_BADGE[issue.status]}>{STATUS_LABELS[issue.status]}</Badge>
            <Badge className={CATEGORY_BADGE[issue.category]}>{issue.category}</Badge>
            {issue.module_area && (
              <Badge className={MODULE_BADGE[issue.module_area]}>{MODULE_LABELS[issue.module_area]}</Badge>
            )}
          </div>
          <p className="text-slate-800 font-semibold text-[13px] leading-snug mb-2">{issue.title}</p>
        <div className="font-mono text-[10px] text-slate-400 flex flex-wrap gap-x-1.5 items-center">
          <span>#{issue.id}</span>
          <span className="text-slate-200">·</span>
          <span>{formatDate(issue.created_at)}</span>
          <span className="text-slate-200">·</span>
          <span>{issue.submitted_by}</span>
          {issue.assigned_to && (
            <>
              <span className="text-slate-200">·</span>
              <span className="text-[#00aeef]">→ {issue.assigned_to}</span>
            </>
          )}
        </div>
        </button>
        {/* Trash button — top-right corner, visible on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
          className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete issue"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {issue.description && (
            <div className="mt-3 prose prose-sm max-w-none text-slate-600 prose-img:rounded-lg prose-img:max-h-96 prose-a:text-[#00aeef] prose-headings:text-slate-800 prose-code:text-[#00aeef] prose-code:bg-sky-50 prose-code:rounded prose-code:px-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.description}</ReactMarkdown>
            </div>
          )}

          {issue.notes && (
            <div className="mt-3 bg-sky-50 border border-sky-100 rounded-lg p-3">
              <p className="font-mono text-[9px] text-sky-600 uppercase tracking-widest mb-1.5 font-semibold">
                Team Notes
              </p>
              <p className="text-slate-600 text-[13px] leading-relaxed">{issue.notes}</p>
            </div>
          )}

          {issue.resolved_at && (
            <p className="mt-3 font-mono text-[10px] text-emerald-600 font-semibold">
              ✓ Resolved {formatDate(issue.resolved_at)}
            </p>
          )}

          <div className="mt-4">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="font-mono text-[10px] uppercase tracking-wider text-[#00aeef] hover:text-[#0090cc] border border-[#00aeef]/30 hover:border-[#00aeef]/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                Update status / notes ↓
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">
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
                      <option value="post-go-live">Post Go-Live Task</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">
                      Assign To
                    </label>
                    <AssignToInput
                      value={editAssigned}
                      onChange={setEditAssigned}
                      assignees={assignees}
                      listId={`assignees-card-${issue.id}`}
                      className={selectClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold">
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
                    className="bg-[#00aeef] hover:bg-[#0090cc] disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors"
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
      setForm({
        title: '',
        description: '',
        submitted_by: '',
        category: 'data',
        priority: 'medium',
        module_area: 'other-unsure',
        assigned_to: '',
      })
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

  const inputClass =
    'w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]/20 transition-colors placeholder-slate-300'
  const labelClass =
    'block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-semibold'

  function cap(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-4 sm:px-8 lg:px-12 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.3em] mb-1.5 font-semibold"
              style={{ color: '#00aeef' }}
            >
              Stellar One
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 tracking-tight leading-none mb-1.5">
              EastFork Go-Live Tracker
            </h1>
            <p className="text-slate-400 text-sm">
              Log issues, track progress, and stay aligned through go-live.
            </p>
          </div>

          {/* Stats — inline on desktop, stacked on mobile */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 sm:shrink-0">
            {[
              { label: 'Open', value: stats.open, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100' },
              { label: 'In Progress', value: stats.inProgress, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
              { label: 'Resolved', value: stats.resolved, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Critical', value: stats.critical, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.bg} border ${s.border} rounded-xl px-3 sm:px-5 py-3 text-center min-w-[62px]`}
              >
                <div className={`font-bold text-xl sm:text-2xl leading-none ${s.color}`}>{s.value}</div>
                <div className="font-mono text-[8px] uppercase tracking-widest text-slate-400 mt-1.5 leading-tight whitespace-nowrap">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-8 lg:px-12 py-8">
        {/* Submit form */}
        <div className="mb-8">
          <button
            onClick={() => { setFormOpen((v) => !v); setSubmitError(null) }}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all duration-150 ${
              formOpen
                ? 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 shadow-sm'
                : 'bg-[#00aeef] hover:bg-[#0090cc] text-white border-transparent shadow-md shadow-sky-200'
            }`}
          >
            {formOpen ? '✕  Cancel' : '+  Log Issue'}
          </button>

          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="mt-4 max-w-2xl bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm"
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
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  The more detail you include, the faster this gets resolved. Describe what happened, what you expected, which records or screens are affected, and any error messages. Use the toolbar to format text or embed images via URL.
                </p>
                <MarkdownEditor
                  value={form.description}
                  onChange={(v) => setForm((p) => ({ ...p, description: v }))}
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
                  <AssignToInput
                    value={form.assigned_to}
                    onChange={(val) => setForm((p) => ({ ...p, assigned_to: val }))}
                    assignees={assignees}
                    listId="assignees-form"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div>
                  <label className={labelClass}>Module / Area</label>
                  <select
                    value={form.module_area}
                    onChange={(e) => setForm((p) => ({ ...p, module_area: e.target.value }))}
                    className={inputClass}
                  >
                    {MODULES.map((m) => (
                      <option key={m} value={m}>
                        {MODULE_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {submitError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#00aeef] hover:bg-[#0090cc] disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-sky-200"
                >
                  {submitting ? 'Submitting…' : 'Submit Issue'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`font-mono text-[9px] uppercase tracking-wider px-3 py-2 transition-colors whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-[#00aeef] text-white'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
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
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {cap(p)}
              </option>
            ))}
          </select>

          <button
            onClick={fetchIssues}
            className="ml-auto font-mono text-[9px] uppercase tracking-wider text-slate-400 hover:text-[#00aeef] transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Issue list */}
        {loading ? (
          <div className="py-20 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">
              Loading issues…
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
            <div className="text-slate-200 text-5xl mb-4 select-none">◌</div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              No issues match the current filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 items-start">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                assignees={assignees}
                onAddAssignee={addAssignee}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-slate-200">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-300 text-center">
            EastFork · Stellar One · Powered by Acumatica
          </p>
        </footer>
      </div>
    </div>
  )
}
