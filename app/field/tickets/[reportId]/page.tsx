'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatFiled } from '@/lib/format'
import PhotoGallery from '@/app/components/photo-gallery'
import AddPhotos from '@/app/components/add-photos'

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  bid_process: 'bg-teal-100 text-teal-700',
  resolved: 'bg-green-100 text-green-700',
}

export default function FieldTicketPage() {
  const params = useParams()
  const reportId = params.reportId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/submission/${reportId}`)
    setData(await r.json())
    setLoading(false)
  }, [reportId])

  useEffect(() => { load() }, [load])

  async function addNote() {
    if (noteText.trim().length === 0) return
    setBusy(true)
    await fetch(`/api/submission/${reportId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'note', text: noteText.trim() }),
    })
    setNoteText('')
    await load()
    setBusy(false)
  }

  const s = data?.submission

  return (
    <div>
      <Link href="/field" className="text-sm text-gray-500 hover:underline">← My properties</Link>

      {loading && !s && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {s && (
        <>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold leading-tight">{s.title}</h1>
              <p className="text-sm text-gray-500">{data.propertyName ?? ''} · {reportId}</p>
            </div>
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {s.status.replace('_', ' ')}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Type</dt><dd className="capitalize">{s.issue_type}</dd></div>
            <div><dt className="text-gray-500">Priority</dt><dd className="capitalize">{s.priority}</dd></div>
            <div className="col-span-2"><dt className="text-gray-500">Location</dt><dd>{s.location ?? '—'}</dd></div>
            <div className="col-span-2"><dt className="text-gray-500">Description</dt><dd className="whitespace-pre-wrap">{s.notes ?? '—'}</dd></div>
          </dl>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Photos</h2>
            <AddPhotos reportId={reportId} onDone={load} />
          </div>
          <div className="mt-2">
            <PhotoGallery photos={data.photos ?? []} />
          </div>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Activity</h2>
          <ul className="mt-2 space-y-2">
            {(data.notes ?? []).map((n: any) => (
              <li key={n.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{n.kind === 'creation' ? 'Reported' : n.kind === 'comment' ? 'Note' : n.kind.replace('_', ' ')}</span>
                  <span>{formatFiled(n.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
              </li>
            ))}
            {(data.notes ?? []).length === 0 && <li className="text-sm text-gray-400">No activity yet.</li>}
          </ul>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder="Add a note…"
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900"
          />
          <button
            type="button"
            onClick={addNote}
            disabled={busy || noteText.trim().length === 0}
            className="mt-2 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white active:bg-brand-hover disabled:opacity-50"
          >
            Add Note
          </button>
        </>
      )}
    </div>
  )
}