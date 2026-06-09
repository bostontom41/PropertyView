import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { propertyPhotoUrl } from '@/lib/format'

export const dynamic = 'force-dynamic'

function initials(name?: string | null): string {
  if (!name) return '—'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties').select('id, name, address, photo_path').order('name')

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Properties</h1>

      <ul className="mt-6 space-y-3">
        {properties?.map((p) => {
          const photo = propertyPhotoUrl(p.photo_path)
          return (
            <li key={p.id}>
              <Link
                href={`/portal/properties/${p.id}`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400 hover:bg-gray-50"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={p.name}
                    className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-medium text-white">
                    {initials(p.name)}
                  </div>
                )}
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.address}</div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}