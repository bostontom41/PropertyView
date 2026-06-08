'use client'

import { useState } from 'react'

type Submission = {
  report_id: string
  title: string
  issue_type: string
  priority: string
  status: string
  created_at: string
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
  bid_process: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
}

export default function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  const [filter, setFilter] = useState('all')

  const shown =
    filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === f.value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {shown.map((s) => (
          <li key={s.report_id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                  STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {s.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {s.report_id} · {s.issue_type} · {s.priority} priority
            </div>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">No submissions in this view.</li>
        )}
      </ul>
    </div>
  )
}