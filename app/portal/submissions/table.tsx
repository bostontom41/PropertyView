'use client'

import { useState } from 'react'
import { useDrawer } from '../drawer-context'
import { formatFiled } from '@/lib/format'

type Submission = {
  report_id: string
  title: string
  issue_type: string
  priority: string
  status: string
  assignee_group: string | null
  created_at: string
  property_name?: string | null
  property_photo?: string | null
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'bid_process', label: 'Bid Process' },
  { value: 'resolved', label: 'Resolved' },
]

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  bid_process: 'bg-teal-100 text-teal-700',
  resolved: 'bg-green-100 text-green-700',
}
const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-gray-100 text-gray-600',
}
const GROUP_META: Record<string, { label: string; initials: string; color: string }> = {
  idc: { label: 'IDC', initials: 'ID', color: 'bg-blue-600' },
  homeside: { label: 'Homeside', initials: 'HS', color: 'bg-amber-500' },
  maintenance: { label: 'Maintenance', initials: 'MT', color: 'bg-teal-600' },
}
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 }
const STATUS_RANK: Record<string, number> = { new: 1, in_progress: 2, bid_process: 3, resolved: 4 }

type SortKey = 'created' | 'priority' | 'status' | 'property'
const DEFAULT_DIR: Record<SortKey, 'asc' | 'desc'> = {
  created: 'desc', priority: 'desc', status: 'asc', property: 'asc',
}

export default function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  const { open } = useDrawer()
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(DEFAULT_DIR[key]) }
  }

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'created') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    else if (sortKey === 'priority') cmp = (PRIORITY_RANK[a.priority] || 0) - (PRIORITY_RANK[b.priority] || 0)
    else if (sortKey === 'status') cmp = (STATUS_RANK[a.status] || 0) - (STATUS_RANK[b.status] || 0)
    else if (sortKey === 'property') cmp = (a.property_name || '').localeCompare(b.property_name || '')
    return sortDir === 'asc' ? cmp : -cmp
  })

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')
  const thBase = 'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600'
  const sortableTh = (key: SortKey, label: string) => (
    <th className={thBase}>
      <button type="button" onClick={() => toggleSort(key)} className="uppercase hover:text-gray-900">
        {label}{arrow(key)}
      </button>
    </th>
  )

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm ${filter === f.value ? 'bg-brand text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className={thBase}>Report</th>
              <th className={thBase}>Title</th>
              {sortableTh('property', 'Property')}
              <th className={thBase}>Type</th>
              {sortableTh('priority', 'Priority')}
              {sortableTh('status', 'Status')}
              <th className={thBase}>Assigned</th>
              {sortableTh('created', 'Created')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const g = s.assignee_group ? GROUP_META[s.assignee_group] : null
              return (
                <tr key={s.report_id} onClick={() => open(s.report_id)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{s.report_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      {s.property_photo && <img src={s.property_photo} alt="" className="h-7 w-7 flex-shrink-0 rounded object-cover" />}
                      <span>{s.property_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{s.issue_type}</td>
                  <td className="px-4 py-3">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium uppercase ${PRIORITY_STYLE[s.priority] ?? 'bg-gray-100 text-gray-600'}`}>{s.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>{s.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {g ? (
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${g.color}`}>{g.initials}</span>
                        <span className="text-gray-700">{g.label}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatFiled(s.created_at)}</td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No submissions in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}