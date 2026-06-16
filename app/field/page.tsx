import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { propertyPhotoUrl } from '@/lib/format'

export const dynamic = 'force-dynamic'

function initials(name?: string | null): string {
  if (!name) return '—'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default async function FieldHome() {
  const supabase = await createClient()

  // RLS scopes this to the user's accessible properties automatically
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, photo_path')
    .order('name')

  // Open-issue counts for the user's visible properties
  const { data: openSubs } = await supabase
    .from('submissions')
    .select('property_id')
    .neq('status', 'resolved')

  const openCount = new Map<string, number>()
  for (const s of openSubs ?? []) openCount.set(s.property_id, (openCount.get(s.property_id) ?? 0) + 1)

  return (
    <div>
      <h1 className="text-xl font-bold">My Properties</h1>
      <p className="mt-1 text-sm text-gray-500">Tap a property to view or file a ticket.</p>

      <div className="mt-5 space-y-3">
        {(properties ?? []).map((p) => {
          const photo = propertyPhotoUrl(p.photo_path)
          const count = openCount.get(p.id) ?? 0
          return (
            <Link
              key={p.id}
              href={`/field/properties/${p.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
            >
              {photo ? (
                <img src={photo} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-medium text-white">
                  {initials(p.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900">{p.name}</div>
                <div className="truncate text-sm text-gray-500">{p.address}</div>
              </div>
              {count > 0 && (
                <span className="flex-shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
        {(properties ?? []).length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            No properties assigned to you yet.
          </div>
        )}
      </div>
    </div>
  )
}