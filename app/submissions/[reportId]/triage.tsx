'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSubmission } from './actions'

const STATUSES = ['new', 'in_progress', 'bid_process', 'resolved']
const GROUPS = ['idc', 'homeside', 'maintenance']

type Props = {
  reportId: string
  status: string
  assigneeGroup: string | null
  requiresBid: boolean
}

export default function TriagePanel({ reportId, status, assigneeGroup, requiresBid }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(updates: {
    status?: string
    assignee_group?: string | null
    requires_bid?: boolean
  }) {
    setSaving(true)
    setMsg('')
    const res = await updateSubmission(reportId, updates)
    setSaving(false)
    if (res.error) {
      setMsg(`Error: ${res.error}`)
    } else {
      setMsg('Saved.')
      router.refresh()
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-gray-200 p-5">
      <h2 className="font-semibold">Triage</h2>

      <div className="mt-4">
        <div className="text-sm text-gray-500">Status</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              disabled={saving}
              onClick={() => save({ status: st })}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                status === st ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-500">Assignee Group</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              disabled={saving}
              onClick={() => save({ assignee_group: g })}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                assigneeGroup === g ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-500">Requires Bid</div>
        <button
          type="button"
          disabled={saving}
          onClick={() => save({ requires_bid: !requiresBid })}
          className={`mt-2 rounded-lg border px-3 py-1.5 text-sm ${
            requiresBid ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {requiresBid ? 'Yes — bid required' : 'No bid required'}
        </button>
      </div>

      {msg && (
        <p className={`mt-4 text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}