'use client'

import { useState } from 'react'
import { createSubmission } from './actions'

const ISSUE_TYPES = [
  { value: 'water', label: '💧 Water Damage' },
  { value: 'fire', label: '🔥 Fire / Smoke' },
  { value: 'mold', label: '🦠 Mold' },
  { value: 'structural', label: '🏚️ Structural' },
  { value: 'equipment', label: '⚙️ Equipment' },
  { value: 'safety', label: '⚠️ Safety' },
  { value: 'maintenance', label: '🔧 General Maintenance' },
  { value: 'other', label: '📋 Other' },
]

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [issueType, setIssueType] = useState('')
  const [priority, setPriority] = useState('medium')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ reportId?: string; error?: string } | null>(null)
  async function handleSubmit() {
    setSubmitting(true)
    setResult(null)
    const res = await createSubmission({ title, issueType, priority, location, notes })
    setResult(res)
    setSubmitting(false)
    if (res.reportId) {
      setTitle(''); setIssueType(''); setPriority('medium'); setLocation(''); setNotes('')
    }
  }
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold">New Submission</h1>
      <p className="mt-1 text-sm text-gray-500">Report an issue from the field.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Summary</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water leak in 2nd floor ceiling"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Issue Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ISSUE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setIssueType(t.value)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  issueType === t.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <div className="mt-2 flex gap-2">
            {['low', 'medium', 'high'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
                  priority === p
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location at Property</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Building B, Unit 204"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe the issue…"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || title.length === 0 || issueType.length === 0}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>

        {result?.reportId && (
          <p className="text-sm text-green-600">
            Submitted — report {result.reportId}
          </p>
        )}
        {result?.error && (
          <p className="text-sm text-red-600">Error: {result.error}</p>
        )}
      </div>
    </main>
  )
}