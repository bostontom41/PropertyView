'use client'

import { useState } from 'react'
import { uploadSubmissionPhotos } from '@/lib/upload-photos'

export default function AddPhotos({ reportId, onDone }: { reportId: string; onDone?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [statusText, setStatusText] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true)
    setStatusText(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}…`)
    const { errors } = await uploadSubmissionPhotos(reportId, files)
    setBusy(false)
    setStatusText('')
    e.target.value = ''
    if (errors.length > 0) {
      alert(`${errors.length} photo(s) failed to upload.`)
    }
    onDone?.()
  }

  return (
    <label className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 ${busy ? 'opacity-50' : ''}`}>
      {busy ? (statusText || 'Uploading…') : '+ Add Photos'}
      <input type="file" accept="image/*,.heic,.heif" multiple onChange={handleFiles} disabled={busy} className="hidden" />
    </label>
  )
}