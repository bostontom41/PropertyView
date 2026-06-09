import Link from 'next/link'
import { formatFiled, propertyPhotoUrl } from '@/lib/format'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PhotoUpload from './photo-upload'
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

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address, manager_email, photo_path')
    .eq('id', id)
    .single()

  if (!property) notFound()

  const photoUrl = propertyPhotoUrl(property.photo_path)

  const { data: tickets } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, created_at')
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const open = (tickets ?? []).filter((t) => t.status !== 'resolved').length

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/portal/properties" className="text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>
      <div className="mt-3">
        <PhotoUpload propertyId={property.id} />
      </div>

      {photoUrl && (
        <img
          src={photoUrl}
          alt={property.name}
          className="mt-4 h-48 w-full rounded-xl border border-gray-200 object-cover"
        />
      )}

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{property.address}</p>
        </div>
        <Link
          href={`/submit?property=${property.id}`}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + New Submission
        </Link>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="text-2xl font-bold">{tickets?.length ?? 0}</div>
          <div className="text-xs text-gray-500">Total tickets</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="text-2xl font-bold">{open}</div>
          <div className="text-xs text-gray-500">Open</div>
        </div>
      </div>

      <h2 className="mt-8 font-semibold">Ticket History</h2>
      <ul className="mt-3 space-y-2">
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
    </main>
  )
}