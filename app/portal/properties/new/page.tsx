'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createProperty } from './actions'

export default function NewPropertyPage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [managerName, setManagerName] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setBusy(true)
    setError('')
    const res = await createProperty({ name, address, managerName, managerEmail })
    // On success the action redirects; we only get here on error
    if (res?.error) {
      setError(res.error)
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

  return (
    <main className="mx-auto max-w-xl p-6 lg:p-8">
      <Link href="/portal/properties" className="text-sm text-gray-500 hover:underline">← All properties</Link>
      <h1 className="mt-3 text-2xl font-bold">Add New Property</h1>
      <p className="mt-1 text-sm text-gray-500">Create the property record, then add a photo on its page.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maple Street Apartments" className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address *</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Maple St, Springfield IL" className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Manager</label>
          <input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="e.g. Libby Lesseigne" className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Manager Email</label>
          <input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="manager@homeside.com" className={field} />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={busy || name.trim().length === 0 || address.trim().length === 0}
          className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create Property'}
        </button>

        {error && <p className="text-sm text-red-600">Error: {error}</p>}
      </div>
    </main>
  )
}