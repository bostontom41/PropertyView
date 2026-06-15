import MapLoader from './map-loader'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'


export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: props } = await supabase
    .from('properties')
    .select('id, name, address, latitude, longitude')

  const { data: openSubs } = await supabase
    .from('submissions')
    .select('property_id')
    .neq('status', 'resolved')

  const openCount = new Map<string, number>()
  for (const s of openSubs ?? []) openCount.set(s.property_id, (openCount.get(s.property_id) ?? 0) + 1)

  const properties = (props ?? [])
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      latitude: p.latitude as number,
      longitude: p.longitude as number,
      openCount: openCount.get(p.id) ?? 0,
    }))

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Map View</h1>
      <p className="mt-1 text-sm text-gray-500">
        Properties and IDC offices. {properties.length} {properties.length === 1 ? 'property' : 'properties'} mapped.
      </p>
      <div className="mt-6">
      <MapLoader properties={properties} />
      </div>
    </main>
  )
}