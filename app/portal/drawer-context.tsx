'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { formatFiled } from '@/lib/format'

type DrawerContextType = { open: (reportId: string) => void; close: () => void }
const DrawerContext = createContext<DrawerContextType | null>(null)

export function useDrawer() {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error('useDrawer must be used within DrawerProvider')
  return ctx
}

export function TicketLink({ reportId, className, children }: { reportId: string; className?: string; children?: ReactNode }) {
    const { open } = useDrawer()
    return <button type="button" onClick={() => open(reportId)} className={className}>{children ?? reportId}</button>
  }

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  bid_process: 'bg-teal-100 text-teal-700',
  resolved: 'bg-green-100 text-green-700',
}
const STATUSES = ['new', 'in_progress', 'bid_process', 'resolved']
const GROUPS = ['idc', 'homeside', 'maintenance']

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [reportId, setReportId] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    const r = await fetch(`/api/submission/${id}`)
    setData(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!reportId) { setData(null); return }
    load(reportId)
  }, [reportId, load])

  const s = data?.submission

  async function triage(updates: any) {
    if (!reportId) return
    setBusy(true)
    await fetch(`/api/submission/${reportId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'triage', updates }),
    })
    await load(reportId)
    setBusy(false)
  }

  async function addNote() {
    if (!reportId || noteText.trim().length === 0) return
    setBusy(true)
    await fetch(`/api/submission/${reportId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'note', text: noteText.trim() }),
    })
    setNoteText('')
    await load(reportId)
    setBusy(false)
  }

  return (
    <DrawerContext.Provider value={{ open: setReportId, close: () => setReportId(null) }}>
      {children}
      {reportId && (
        <>
          <div onClick={() => setReportId(null)} className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300" />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="font-semibold">{reportId}</h2>
              <button onClick={() => setReportId(null)} className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">✕ Close</button>
            </div>

            <div className="p-5">
              {loading && !s && <p className="text-sm text-gray-500">Loading…</p>}
              {s && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{s.title}</h3>
                      <p className="mt-0.5 text-sm text-gray-500">{data.propertyName ?? '—'}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div><dt className="text-gray-500">Issue Type</dt><dd className="capitalize">{s.issue_type}</dd></div>
                    <div><dt className="text-gray-500">Priority</dt><dd className="capitalize">{s.priority}</dd></div>
                    <div className="col-span-2"><dt className="text-gray-500">Location</dt><dd>{s.location ?? '—'}</dd></div>
                  </dl>

                  <div className="mt-6 rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold">Triage</h4>
                    <div className="mt-3 text-xs text-gray-500">Status</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {STATUSES.map((st) => (
                        <button key={st} disabled={busy} onClick={() => triage({ status: st })}
                          className={`rounded-lg border px-2.5 py-1 text-xs capitalize ${s.status === st ? 'border-brand bg-brand text-white' : 'border-gray-300 hover:bg-gray-50'}`}>
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-500">Assignee Group</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {GROUPS.map((g) => (
                        <button key={g} disabled={busy} onClick={() => triage({ assignee_group: g })}
                          className={`rounded-lg border px-2.5 py-1 text-xs capitalize ${s.assignee_group === g ? 'border-brand bg-brand text-white' : 'border-gray-300 hover:bg-gray-50'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-500">Requires Bid</div>
                    <button disabled={busy} onClick={() => triage({ requires_bid: !s.requires_bid })}
                      className={`mt-1 rounded-lg border px-2.5 py-1 text-xs ${s.requires_bid ? 'border-brand bg-brand text-white' : 'border-gray-300 hover:bg-gray-50'}`}>
                      {s.requires_bid ? 'Yes — bid required' : 'No bid required'}
                    </button>
                  </div>

                  <h4 className="mt-6 text-sm font-semibold">Activity</h4>
                  <ul className="mt-3 space-y-3">
                    {(data.notes ?? []).map((n: any) => (
                      <li key={n.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{n.kind === 'creation' ? 'Ticket created' : 'Note'} · {data.authorEmail?.[n.author_id] ?? 'Unknown'}</span>
                          <span>{formatFiled(n.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                      </li>
                    ))}
                    {(data.notes ?? []).length === 0 && <li className="text-sm text-gray-400">No activity yet.</li>}
                  </ul>

                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="Add a note…"
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                  <button disabled={busy || noteText.trim().length === 0} onClick={addNote}
                    className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
                    Add Note
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </DrawerContext.Provider>
  )
}