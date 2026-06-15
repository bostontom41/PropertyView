import Link from 'next/link'
import { formatFiled, propertyPhotoUrl } from '@/lib/format'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import PhotoUpload from './photo-upload'
import OverviewTab from './overview'
import ContactsTab from './contacts'
import AttachmentsTab from './attachments'
import PropertyTabs from './tabs'
import { TicketLink } from '../../drawer-context'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  bid_process: 'bg-teal-100 text-teal-700',
  resolved: 'bg-green-100 text-green-700',
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCurrentUser()
  const isAdmin = user?.role === 'admin'

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, manager_name, manager_email, regional_manager_name, regional_manager_email, photo_path, property_type, num_units, square_footage, year_built, roof_age, mechanical_age, after_hours_contact')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const photoUrl = propertyPhotoUrl(property.photo_path)

  const { data: tickets } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, created_at')
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const { data: contacts } = await supabase
    .from('property_contacts')
    .select('id, name, role, phone, email, is_primary, notes')
    .eq('property_id', id)
    .order('is_primary', { ascending: false })
    .order('name')

  const { data: attachments } = await supabase
    .from('property_attachments')
    .select('id, file_name, storage_path, file_type, file_size, created_at')
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const open = (tickets ?? []).filter((t) => t.status !== 'resolved').length

  // Ticket history content (rendered here, passed into the Tickets tab)
  const ticketsContent = (
    <div>
      <div className="flex gap-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="text-2xl font-bold">{tickets?.length ?? 0}</div>
          <div className="text-xs text-gray-500">Total tickets</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="text-2xl font-bold">{open}</div>
          <div className="text-xs text-gray-500">Open</div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {(tickets ?? []).map((t) => (
          <li key={t.report_id}>
            <TicketLink
              reportId={t.report_id}
              className="block w-full text-left rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {t.report_id} · {t.issue_type} · {t.priority} priority · {formatFiled(t.created_at)}
              </div>
            </TicketLink>
          </li>
        ))}
        {(tickets ?? []).length === 0 && (
          <li className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            No tickets yet for this property.
          </li>
        )}
      </ul>
    </div>
  )

  return (
    <main className="mx-auto max-w-5xl p-6 lg:p-8">
      <Link href="/portal/properties" className="text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <div className="mt-3 flex items-start gap-5">
        {photoUrl ? (
          <img src={photoUrl} alt={property.name} className="h-28 w-40 flex-shrink-0 rounded-xl border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-28 w-40 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">No photo</div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{property.address}</p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/portal/submit?property=${property.id}`}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              + New Submission
            </Link>
            {isAdmin && <PhotoUpload propertyId={property.id} />}
          </div>
        </div>
      </div>

      <PropertyTabs
        overview={<OverviewTab property={property} canEdit={isAdmin} />}
        tickets={ticketsContent}
        contacts={<ContactsTab propertyId={property.id} contacts={contacts ?? []} canManage={isAdmin} />}
        attachments={<AttachmentsTab propertyId={property.id} attachments={attachments ?? []} canManage={isAdmin} />}
      />
    </main>
  )
}