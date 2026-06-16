import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { propertyPhotoUrl, formatFiled } from '@/lib/format'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  bid_process: 'bg-teal-100 text-teal-700',
  resolved: 'bg-green-100 text-green-700',
}

function ContactRow({ name, role, phone, email }: { name: string; role?: string | null; phone?: string | null; email?: string | null }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="font-medium text-gray-900">{name}</div>
      {role && <div className="text-xs text-gray-500">{role}</div>}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {phone && <a href={`tel:${phone}`} className="text-brand underline">{phone}</a>}
        {email && <a href={`mailto:${email}`} className="text-brand underline">{email}</a>}
      </div>
    </div>
  )
}

export default async function FieldPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, photo_path, manager_name, manager_email, regional_manager_name, regional_manager_email')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const photoUrl = propertyPhotoUrl(property.photo_path)

  const { data: contacts } = await supabase
    .from('property_contacts')
    .select('id, name, role, phone, email, is_primary')
    .eq('property_id', id)
    .order('is_primary', { ascending: false })
    .order('name')

  const { data: tickets } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, created_at')
    .eq('property_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="pb-24">
      <Link href="/field" className="text-sm text-gray-500 hover:underline">← My properties</Link>

      {/* Header */}
      <div className="mt-3 flex items-start gap-3">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">No photo</div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight">{property.name}</h1>
          <p className="text-sm text-gray-500">{property.address}</p>
        </div>
      </div>

      {/* Contacts */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Contacts</h2>
      <div className="mt-2 space-y-2">
        {property.manager_name || property.manager_email ? (
          <ContactRow name={property.manager_name || 'Property Manager'} role="Property Manager" email={property.manager_email} />
        ) : null}
        {property.regional_manager_name || property.regional_manager_email ? (
          <ContactRow name={property.regional_manager_name || 'Regional Manager'} role="Regional Manager" email={property.regional_manager_email} />
        ) : null}
        {(contacts ?? []).map((c) => (
          <ContactRow key={c.id} name={c.is_primary ? `${c.name} ★` : c.name} role={c.role} phone={c.phone} email={c.email} />
        ))}
        {!property.manager_email && !property.regional_manager_email && (contacts ?? []).length === 0 && (
          <p className="text-sm text-gray-400">No contacts listed.</p>
        )}
      </div>

      {/* Ticket history */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent Tickets</h2>
      <div className="mt-2 space-y-2">
        {(tickets ?? []).map((t) => (
          <div key={t.report_id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900">{t.title}</span>
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {t.report_id} · {t.issue_type} · {t.priority} · {formatFiled(t.created_at)}
            </div>
          </div>
        ))}
        {(tickets ?? []).length === 0 && (
          <p className="text-sm text-gray-400">No tickets yet for this property.</p>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/field/submit?property=${property.id}`}
            className="block w-full rounded-xl bg-brand px-4 py-3.5 text-center font-semibold text-white active:bg-brand-hover"
          >
            + Report an Issue
          </Link>
        </div>
      </div>
    </div>
  )
}