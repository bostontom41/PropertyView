'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatFiled } from '@/lib/format'

type Submission = {
  report_id: string
  title: string
  issue_type: string
  priority: string
  status: string
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

function initials(name?: string | null): string {
  if (!name) return '—'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === f.value ? 'bg-brand text-white' : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {shown.map((s) => (
          <li key={s.report_id}>
            <Link
              href={`/submissions/${s.report_id}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400 hover:bg-gray-50"
            >
              {s.property_photo ? (
                <img
                  src={s.property_photo}
                  alt={s.property_name ?? ''}
                  className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-medium text-white">
                  {initials(s.property_name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{s.title}</span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${
                      STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-gray-700">{s.property_name ?? '—'}</div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {s.report_id} · {s.issue_type} · {s.priority} priority · {formatFiled(s.created_at)}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">No submissions in this view.</li>
        )}
      </ul>
    </div>
  )
}