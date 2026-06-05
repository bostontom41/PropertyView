import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, name, address, manager_email')
    .order('name')

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Properties</h1>
      <p className="mt-1 text-sm text-gray-500">
        Showing what your account is allowed to see.
      </p>

      {error && (
        <p className="mt-4 text-red-600">Error: {error.message}</p>
      )}

      <ul className="mt-6 space-y-3">
        {properties?.map((p) => (
          <li key={p.id} className="rounded-lg border border-gray-200 p-4">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-gray-500">{p.address}</div>
            <div className="text-xs text-gray-400">{p.manager_email}</div>
          </li>
        ))}
      </ul>

      {properties?.length === 0 && !error && (
        <p className="mt-4 text-gray-500">No properties visible to your account.</p>
      )}
    </main>
  )
}