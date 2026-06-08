import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const { data: properties } = await supabase
    .from('properties').select('id, name, address').order('name')

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Properties</h1>
        <form action={signOut}>
          <span className="mr-3 text-sm text-gray-500">{claims?.claims?.email}</span>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
            Sign out
          </button>
        </form>
      </div>

      <ul className="mt-6 space-y-3">
        {properties?.map((p) => (
          <li key={p.id} className="rounded-lg border border-gray-200 p-4">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-gray-500">{p.address}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}