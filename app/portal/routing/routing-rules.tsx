'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveRoutingRule, deleteRoutingRule } from './actions'

type Rule = {
  id: string
  label: string
  recipient_email: string
  issue_types: string[]
  on_high_priority: boolean
  on_requires_bid: boolean
}

const ISSUE_TYPES = ['water', 'fire', 'mold', 'structural', 'equipment', 'safety', 'maintenance', 'other']

const blank = {
  id: undefined as string | undefined,
  label: '',
  recipient_email: '',
  issue_types: [] as string[],
  on_high_priority: false,
  on_requires_bid: false,
}

export default function RoutingRules({ rules }: { rules: Rule[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<typeof blank | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!editing || editing.label.trim() === '' || editing.recipient_email.trim() === '') return
    setBusy(true)
    await saveRoutingRule(editing)
    setBusy(false)
    setEditing(null)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this routing rule?')) return
    setBusy(true)
    await deleteRoutingRule(id)
    setBusy(false)
    router.refresh()
  }

  function toggleType(t: string) {
    if (!editing) return
    setEditing({
      ...editing,
      issue_types: editing.issue_types.includes(t)
        ? editing.issue_types.filter((x) => x !== t)
        : [...editing.issue_types, t],
    })
  }

  const input = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900'

  function summary(r: Rule): string {
    const parts: string[] = []
    if (r.issue_types.length > 0) parts.push(r.issue_types.join(', '))
    if (r.on_high_priority) parts.push('high priority')
    if (r.on_requires_bid) parts.push('requires bid')
    return parts.length ? parts.join(' · ') : 'no triggers set'
  }

  return (
    <div className="mt-6">
      {!editing && (
        <button onClick={() => setEditing({ ...blank })} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
          + Add Recipient
        </button>
      )}

      {editing && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Label</label>
              <input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g. IDC Trades" className={input} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Email</label>
              <input type="email" value={editing.recipient_email} onChange={(e) => setEditing({ ...editing, recipient_email: e.target.value })} placeholder="idc@idc247.com" className={input} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Notify on issue types</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ISSUE_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${editing.issue_types.includes(t) ? 'border-brand bg-brand text-white' : 'border-gray-300 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.on_high_priority} onChange={(e) => setEditing({ ...editing, on_high_priority: e.target.checked })} />
              Notify on any high-priority ticket
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.on_requires_bid} onChange={(e) => setEditing({ ...editing, on_requires_bid: e.target.checked })} />
              Notify when a bid is required
            </label>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={save} disabled={busy || editing.label.trim() === '' || editing.recipient_email.trim() === ''}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {rules.map((r) => (
          <li key={r.id} className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div className="min-w-0">
              <div className="font-medium text-gray-900">{r.label}</div>
              <div className="text-sm text-gray-500">{r.recipient_email}</div>
              <div className="mt-1 text-xs capitalize text-gray-600">Triggers: {summary(r)}</div>
            </div>
            <div className="ml-3 flex flex-shrink-0 gap-3">
              <button onClick={() => setEditing({ id: r.id, label: r.label, recipient_email: r.recipient_email, issue_types: r.issue_types ?? [], on_high_priority: r.on_high_priority, on_requires_bid: r.on_requires_bid })}
                className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
              <button onClick={() => remove(r.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
        {rules.length === 0 && !editing && <li className="text-sm text-gray-400">No routing rules yet.</li>}
      </ul>
    </div>
  )
}