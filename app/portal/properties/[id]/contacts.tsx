'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveContact, deleteContact } from './actions'

type Contact = {
  id: string
  name: string
  role: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
  notes: string | null
}

const blank = { id: undefined as string | undefined, name: '', role: '', phone: '', email: '', is_primary: false, notes: '' }

export default function ContactsTab({
  propertyId,
  contacts,
  canManage,
}: {
  propertyId: string
  contacts: Contact[]
  canManage: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<typeof blank | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!editing || editing.name.trim().length === 0) return
    setBusy(true)
    await saveContact(propertyId, editing)
    setBusy(false)
    setEditing(null)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this contact?')) return
    setBusy(true)
    await deleteContact(propertyId, id)
    setBusy(false)
    router.refresh()
  }

  const input = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Contacts</h3>
        {canManage && !editing && (
          <button onClick={() => setEditing({ ...blank })} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover">
            + Add Contact
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Name *</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={input} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Role</label>
              <input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="e.g. Property Manager" className={input} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Phone</label>
              <input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={input} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Email</label>
              <input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={input} />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs uppercase tracking-wide text-gray-500">Notes</label>
            <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} className={input} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_primary} onChange={(e) => setEditing({ ...editing, is_primary: e.target.checked })} />
            Primary contact
          </label>
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={busy || editing.name.trim().length === 0} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {contacts.map((c) => (
          <li key={c.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.is_primary && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-amber-700">Primary</span>}
                </div>
                {c.role && <div className="text-sm text-gray-500">{c.role}</div>}
                <div className="mt-1 text-sm text-gray-700">
                  {c.phone && <span className="mr-3">{c.phone}</span>}
                  {c.email && <span>{c.email}</span>}
                </div>
                {c.notes && <p className="mt-1 text-sm text-gray-500">{c.notes}</p>}
              </div>
              {canManage && (
                <div className="flex flex-shrink-0 gap-2">
                  <button onClick={() => setEditing({ id: c.id, name: c.name, role: c.role ?? '', phone: c.phone ?? '', email: c.email ?? '', is_primary: c.is_primary, notes: c.notes ?? '' })}
                    className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
                  <button onClick={() => remove(c.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </div>
              )}
            </div>
          </li>
        ))}
        {contacts.length === 0 && <li className="text-sm text-gray-400">No contacts yet.</li>}
      </ul>
    </div>
  )
}