import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties').select('id, name, address').order('name')

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Properties</h1>

      <ul className="mt-6 space-y-3">
        {properties?.map((p) => (
          <li key={p.id}>
            <Link
              href={`/portal/properties/${p.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">{p.address}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}