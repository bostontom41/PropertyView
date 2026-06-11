'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProperty } from './actions'

const PROPERTY_TYPES = ['Apartment', 'HOA/Condo', 'Commercial', 'Single-family', 'Mixed-use']

type Property = {
  id: string
  name: string
  address: string
  manager_name: string | null
  manager_email: string | null
  property_type: string | null
  num_units: number | null
  square_footage: number | null
  year_built: number | null
  roof_age: string | null
  mechanical_age: string | null
  after_hours_contact: string | null
}

export default function OverviewTab({ property, canEdit }: { property: Property; canEdit: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(property)

  function set<K extends keyof Property>(key: K, value: Property[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save() {
    setBusy(true)
    await updateProperty(property.id, {
      manager_name: form.manager_name,
      manager_email: form.manager_email,
      property_type: form.property_type,
      num_units: form.num_units,
      square_footage: form.square_footage,
      year_built: form.year_built,
      roof_age: form.roof_age,
      mechanical_age: form.mechanical_age,
      after_hours_contact: form.after_hours_contact,
    })
    setBusy(false)
    setEditing(false)
    router.refresh()
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</dd>
    </div>
  )

  const input = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900'
  const Field = ({ label, k, type = 'text' }: { label: string; k: keyof Property; type?: string }) => (
    <div>
      <label className="text-xs uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        value={(form[k] as any) ?? ''}
        onChange={(e) => set(k, (type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value) as any)}
        className={input}
      />
    </div>
  )

  if (!editing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Property Info</h3>
          {canEdit && (
            <button onClick={() => { setForm(property); setEditing(true) }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              Edit
            </button>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Row label="Property Type" value={property.property_type} />
          <Row label="Units" value={property.num_units} />
          <Row label="Square Footage" value={property.square_footage?.toLocaleString()} />
          <Row label="Year Built" value={property.year_built} />
          <Row label="Roof Age" value={property.roof_age} />
          <Row label="Mechanical Age" value={property.mechanical_age} />
          <Row label="Manager" value={property.manager_name} />
          <Row label="Manager Email" value={property.manager_email} />
          <Row label="After-Hours Contact" value={property.after_hours_contact} />
        </dl>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="font-semibold">Edit Property Info</h3>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-gray-500">Property Type</label>
          <select value={form.property_type ?? ''} onChange={(e) => set('property_type', e.target.value || null)} className={input}>
            <option value="">—</option>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Field label="Units" k="num_units" type="number" />
        <Field label="Square Footage" k="square_footage" type="number" />
        <Field label="Year Built" k="year_built" type="number" />
        <Field label="Roof Age" k="roof_age" />
        <Field label="Mechanical Age" k="mechanical_age" />
        <Field label="Manager" k="manager_name" />
        <Field label="Manager Email" k="manager_email" type="email" />
        <Field label="After-Hours Contact" k="after_hours_contact" />
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={save} disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )
}