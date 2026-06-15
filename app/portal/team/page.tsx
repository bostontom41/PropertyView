import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import TeamList from './team-list'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/portal')

  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('full_name')

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .order('name')

  const { data: assignments } = await supabase
    .from('user_properties')
    .select('user_id, property_id')

  // Build map of userId -> [propertyId]
  const assignmentMap: Record<string, string[]> = {}
  for (const a of assignments ?? []) {
    ;(assignmentMap[a.user_id] ??= []).push(a.property_id)
  }

  return (
    <main className="mx-auto max-w-4xl p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Team &amp; Roles</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage user roles and property assignments. Create new users in the Supabase dashboard; set their access here.
      </p>
      <TeamList
        users={users ?? []}
        properties={properties ?? []}
        assignmentMap={assignmentMap}
        currentUserId={user.id}
      />
    </main>
  )
}