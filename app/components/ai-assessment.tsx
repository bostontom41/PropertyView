'use client'

import { useState, useEffect, useRef } from 'react'

type Note = { id: string; kind: string; body: string; created_at: string; author_id: string }

export default function AiAssessment({
  reportId,
  notes,
  photoCount,
  autoAnalyze = false,
  onDone,
}: {
  reportId: string
  notes: Note[]
  photoCount: number
  autoAnalyze?: boolean
  onDone?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const prevCount = useRef<number | null>(null)

  const hasPhotos = photoCount > 0
  // Notes arrive oldest-first, so the last ai_assessment is the newest one.
  const latest = [...notes].filter((n) => n.kind === 'ai_assessment').slice(-1)[0]

  async function analyze() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch(`/api/submission/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      })
      const j = await r.json()
      if (!r.ok) setError(j.error ?? 'Analysis failed.')
    } catch {
      setError('Analysis failed.')
    }
    setBusy(false)
    onDone?.()
  }

  // Field surface only: auto-run when new photos are added.
  // We initialize prevCount on first render (so existing photos on page load
  // do NOT trigger a run), then fire only when the count increases afterward.
  useEffect(() => {
    if (!autoAnalyze) return
    if (prevCount.current === null) {
      prevCount.current = photoCount
      return
    }
    if (photoCount > prevCount.current) {
      analyze()
    }
    prevCount.current = photoCount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoCount, autoAnalyze])

  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">AI Assessment</h4>
        <button
          type="button"
          onClick={analyze}
          disabled={busy || !hasPhotos}
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? 'Analyzing…' : latest ? 'Re-analyze Photos' : 'Analyze Photos'}
        </button>
      </div>

      {!hasPhotos && <p className="mt-2 text-xs text-gray-400">Add photos to enable analysis.</p>}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {busy && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
          <span className="text-sm text-amber-800">Analyzing photos… this takes a few seconds.</span>
        </div>
      )}

      {!busy && latest && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
            AI Assessment — advisory only
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{latest.body}</p>
        </div>
      )}

      {!busy && !latest && hasPhotos && (
        <p className="mt-2 text-xs text-gray-400">No assessment yet — tap Analyze Photos to generate one.</p>
      )}
    </div>
  )
}