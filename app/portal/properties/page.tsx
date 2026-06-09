import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { propertyPhotoUrl } from '@/lib/format'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function initials(name?: string | null): string {
  if (!name) return '—'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// Color the open-issue count by the highest-priority open ticket at that property
const COUNT_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-gray-100 text-gray-600',
  none: 'bg-gray-50 text-gray-400',
}
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 }

export default async function PropertiesPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const isAdmin = user?.role === 'admin'

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address, manager_name, photo_path')
    .order('name')

  // Pull open submissions to compute per-property counts + top priority
  const { data: openSubs } = await supabase
    .from('submissions')
    .select('property_id, priority, status')
    .neq('status', 'resolved')

  const openByProp = new Map<string, { count: number; topPriority: string }>()
  for (const sub of openSubs ?? []) {
    const cur = openByProp.get(sub.property_id) ?? { count: 0, topPriority: 'low' }
    cur.count += 1
    if ((PRIORITY_RANK[sub.priority] || 0) > (PRIORITY_RANK[cur.topPriority] || 0)) cur.topPriority = sub.priority
    openByProp.set(sub.property_id, cur)
  }

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Properties</h1>
        {isAdmin && (
          <Link href="/portal/properties/new" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">
            + Add New Property
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Property</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Address</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Manager</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-600">Open Issues</th>
            </tr>
          </thead>
          <tbody>
            {(properties ?? []).map((p) => {
              const photo = propertyPhotoUrl(p.photo_path)
              const open = openByProp.get(p.id)
              const count = open?.count ?? 0
              const style = count === 0 ? COUNT_STYLE.none : COUNT_STYLE[open!.topPriority] ?? COUNT_STYLE.low
              return (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/portal/properties/${p.id}`} className="flex items-center gap-3 font-medium text-gray-900 hover:text-brand">
                      {photo ? (
                        <img src={photo} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-medium text-white">{initials(p.name)}</span>
                      )}
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.address}</td>
                  <td className="px-4 py-3 text-gray-700">{p.manager_name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex min-w-[2rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${style}`}>
                      {count}
                    </span>
                  </td>
                </tr>
              )
            })}
            {(properties ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No properties yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}