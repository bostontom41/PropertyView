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
  regional_manager_name: string | null
  regional_manager_email: string | null
  property_type: string | null
  num_units: number | null
  square_footage: number | null
  year_built: number | null
  roof_age: string | null
  mechanical_age: string | null
  after_hours_contact: string | null
}

const inputCls = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</dd>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string | null) => void
  type?: string
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? null : (Number(e.target.value) as any)) : e.target.value)}
        className={inputCls}
      />
    </div>
  )
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
      regional_manager_name: form.regional_manager_name,
      regional_manager_email: form.regional_manager_email,
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
          <Row label="Regional Manager" value={property.regional_manager_name} />
          <Row label="Regional Manager Email" value={property.regional_manager_email} />
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
          <select value={form.property_type ?? ''} onChange={(e) => set('property_type', e.target.value || null)} className={inputCls}>
            <option value="">—</option>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Field label="Units" type="number" value={(form.num_units as any) ?? ''} onChange={(v) => set('num_units', v as any)} />
        <Field label="Square Footage" type="number" value={(form.square_footage as any) ?? ''} onChange={(v) => set('square_footage', v as any)} />
        <Field label="Year Built" type="number" value={(form.year_built as any) ?? ''} onChange={(v) => set('year_built', v as any)} />
        <Field label="Roof Age" value={form.roof_age ?? ''} onChange={(v) => set('roof_age', v)} />
        <Field label="Mechanical Age" value={form.mechanical_age ?? ''} onChange={(v) => set('mechanical_age', v)} />
        <Field label="Manager" value={form.manager_name ?? ''} onChange={(v) => set('manager_name', v)} />
        <Field label="Manager Email" type="email" value={form.manager_email ?? ''} onChange={(v) => set('manager_email', v)} />
        <Field label="Regional Manager" value={form.regional_manager_name ?? ''} onChange={(v) => set('regional_manager_name', v)} />
        <Field label="Regional Manager Email" type="email" value={form.regional_manager_email ?? ''} onChange={(v) => set('regional_manager_email', v)} />
        <Field label="After-Hours Contact" value={form.after_hours_contact ?? ''} onChange={(v) => set('after_hours_contact', v)} />
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