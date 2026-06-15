'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatFiled } from '@/lib/format'
import { uploadAttachment, getAttachmentUrl, deleteAttachment } from './actions'

type Attachment = {
  id: string
  file_name: string
  storage_path: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function fileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentsTab({
  propertyId,
  attachments,
  canManage,
}: {
  propertyId: string
  attachments: Attachment[]
  canManage: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setBusy(true)
    setError('')
    for (const f of files) {
      const base64 = await readFileAsBase64(f)
      const res = await uploadAttachment(propertyId, { name: f.name, type: f.type, size: f.size, base64 })
      if (res?.error) { setError(res.error); break }
    }
    setBusy(false)
    e.target.value = ''
    router.refresh()
  }

  async function download(storagePath: string) {
    const res = await getAttachmentUrl(storagePath)
    if (res?.url) window.open(res.url, '_blank')
  }

  async function remove(id: string, storagePath: string) {
    if (!confirm('Delete this file?')) return
    setBusy(true)
    await deleteAttachment(propertyId, id, storagePath)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Attachments</h3>
        {canManage && (
          <label className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover">
            {busy ? 'Uploading…' : '+ Upload'}
            <input type="file" multiple onChange={handleUpload} disabled={busy} className="hidden" />
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">Property documents — blueprints, estimates, insurance, etc.</p>

      {error && <p className="mt-3 text-sm text-red-600">Error: {error}</p>}

      <ul className="mt-4 space-y-2">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <button onClick={() => download(a.storage_path)} className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium text-gray-900 hover:text-brand">{a.file_name}</div>
              <div className="text-xs text-gray-500">
                {fileSize(a.file_size)}{a.file_size ? ' · ' : ''}{formatFiled(a.created_at)}
              </div>
            </button>
            {canManage && (
              <button onClick={() => remove(a.id, a.storage_path)} className="ml-3 flex-shrink-0 text-sm text-red-500 hover:text-red-700">
                Delete
              </button>
            )}
          </li>
        ))}
        {attachments.length === 0 && <li className="text-sm text-gray-400">No documents yet.</li>}
      </ul>
    </div>
  )
}