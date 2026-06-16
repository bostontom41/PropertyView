'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createSubmission } from '../../portal/submit/actions'

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

function FieldSubmitForm() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property')
  const [title, setTitle] = useState('')
  const [issueType, setIssueType] = useState('')
  const [priority, setPriority] = useState('medium')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<{ name: string; type: string; base64: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ reportId?: string; error?: string } | null>(null)

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const encoded = await Promise.all(
      files.map(async (f) => ({ name: f.name, type: f.type, base64: await readFileAsBase64(f) }))
    )
    setPhotos((prev) => [...prev, ...encoded])
  }

  async function handleSubmit() {
    setSubmitting(true)
    setResult(null)
    const res = await createSubmission({ title, issueType, priority, location, notes, photos, propertyId })
    setResult(res)
    setSubmitting(false)
    if (res.reportId) {
      setTitle(''); setIssueType(''); setPriority('medium'); setLocation(''); setNotes(''); setPhotos([])
    }
  }

  const inputCls = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900'

  return (
    <div className="pb-28">
      <Link href={propertyId ? `/field/properties/${propertyId}` : '/field'} className="text-sm text-gray-500 hover:underline">
        ← Cancel
      </Link>
      <h1 className="mt-3 text-xl font-bold">Report an Issue</h1>

      <div className="mt-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Summary</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water leak in 2nd floor ceiling" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Issue Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ISSUE_TYPES.map((t) => (
              <button key={t.value} type="button" onClick={() => setIssueType(t.value)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm ${issueType === t.value ? 'border-brand bg-brand text-white' : 'border-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <div className="mt-2 flex gap-2">
            {['low', 'medium', 'high'].map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm capitalize ${priority === p ? 'border-brand bg-brand text-white' : 'border-gray-300'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location at Property</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Building B, Unit 204" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Describe the issue in detail…" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Photos</label>
          <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotos}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white" />
          {photos.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">{photos.length} photo{photos.length > 1 ? 's' : ''} ready</p>
          )}
        </div>

        {result?.reportId && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-700">Submitted — report {result.reportId}</p>
            <div className="mt-3 flex justify-center gap-2">
              {propertyId && (
                <Link href={`/field/properties/${propertyId}`} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
                  Back to Property
                </Link>
              )}
              <button type="button" onClick={() => setResult(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
                File Another
              </button>
            </div>
          </div>
        )}
        {result?.error && <p className="text-sm text-red-600">Error: {result.error}</p>}
      </div>

      {/* Sticky submit bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-lg">
          <button type="button" onClick={handleSubmit}
            disabled={submitting || title.length === 0 || issueType.length === 0 || notes.trim().length === 0}
            className="block w-full rounded-xl bg-brand px-4 py-3.5 text-center font-semibold text-white active:bg-brand-hover disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FieldSubmitPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading…</div>}>
      <FieldSubmitForm />
    </Suspense>
  )
}