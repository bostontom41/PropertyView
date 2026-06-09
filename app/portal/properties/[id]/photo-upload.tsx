'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadPropertyPhoto } from './actions'

export default function PhotoUpload({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMsg('')
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve((r.result as string).split(',')[1])
      r.onerror = reject
      r.readAsDataURL(file)
    })
    const res = await uploadPropertyPhoto(propertyId, { name: file.name, type: file.type, base64 })
    setBusy(false)
    if (res.error) setMsg(`Error: ${res.error}`)
    else {
      setMsg('Photo updated.')
      router.refresh()
    }
  }

  return (
    <div>
      <label className="inline-block cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
        {busy ? 'Uploading…' : 'Upload photo'}
        <input type="file" accept="image/*" onChange={handleFile} disabled={busy} className="hidden" />
      </label>
      {msg && <span className={`ml-3 text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</span>}
    </div>
  )
}