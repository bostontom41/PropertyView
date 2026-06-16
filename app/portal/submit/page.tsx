'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSubmission } from './actions'
import { uploadSubmissionPhotos } from '@/lib/upload-photos'

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

function SubmitForm() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get('property')
  const [title, setTitle] = useState('')
  const [issueType, setIssueType] = useState('')
  const [priority, setPriority] = useState('medium')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState<{ reportId?: string; error?: string } | null>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
  }

  async function handleSubmit() {
    setSubmitting(true)
    setResult(null)
    setStatusText('Creating ticket…')

    const res = await createSubmission({ title, issueType, priority, location, notes, propertyId })

    if (res.error || !res.reportId) {
      setResult(res)
      setSubmitting(false)
      setStatusText('')
      return
    }

    if (files.length > 0) {
      setStatusText(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}…`)
      const { errors } = await uploadSubmissionPhotos(res.reportId, files)
      if (errors.length > 0) {
        setResult({ reportId: res.reportId, error: `Ticket filed, but ${errors.length} photo(s) failed to upload.` })
        setSubmitting(false)
        setStatusText('')
        setTitle(''); setIssueType(''); setPriority('medium'); setLocation(''); setNotes(''); setFiles([])
        return
      }
    }

    setResult({ reportId: res.reportId })
    setSubmitting(false)
    setStatusText('')
    setTitle(''); setIssueType(''); setPriority('medium'); setLocation(''); setNotes(''); setFiles([])
  }

  const inputCls = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

  return (
    <main className="mx-auto max-w-md p-6 lg:p-8">
      <h1 className="text-xl font-bold">New Submission</h1>
      <p className="mt-1 text-sm text-gray-500">Report an issue at this property.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Summary</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water leak in 2nd floor ceiling" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Issue Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ISSUE_TYPES.map((t) => (
              <button key={t.value} type="button" onClick={() => setIssueType(t.value)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${issueType === t.value ? 'border-brand bg-brand text-white' : 'border-gray-300 hover:bg-gray-50'}`}>
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
                className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${priority === p ? 'border-brand bg-brand text-white' : 'border-gray-300 hover:bg-gray-50'}`}>
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
          <input type="file" accept="image/*,.heic,.heif" multiple onChange={handleFiles}
            className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white" />
          {files.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">{files.length} photo{files.length > 1 ? 's' : ''} ready to upload</p>
          )}
        </div>

        <button type="button" onClick={handleSubmit}
          disabled={submitting || title.length === 0 || issueType.length === 0 || notes.trim().length === 0}
          className="w-full rounded-lg bg-brand px-4 py-3 font-medium text-white hover:bg-brand-hover disabled:opacity-50">
          {submitting ? (statusText || 'Submitting…') : 'Submit Report'}
        </button>

        {result?.reportId && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-700">Submitted — report {result.reportId}</p>
            {result.error && <p className="mt-1 text-xs text-orange-600">{result.error}</p>}
            <div className="mt-3 flex justify-center gap-2">
              {propertyId && (
                <a href={`/portal/properties/${propertyId}`} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
                  View Property
                </a>
              )}
              <button type="button" onClick={() => setResult(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                File Another
              </button>
            </div>
          </div>
        )}
        {result?.error && !result.reportId && <p className="text-sm text-red-600">Error: {result.error}</p>}
      </div>
    </main>
  )
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
      <SubmitForm />
    </Suspense>
  )
}