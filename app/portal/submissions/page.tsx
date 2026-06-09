import { createClient } from '@/lib/supabase/server'
import { propertyPhotoUrl } from '@/lib/format'
import SubmissionsTable from './table'

export const dynamic = 'force-dynamic'

export default async function PortalSubmissionsPage() {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, assignee_group, created_at, property_id')
    .order('created_at', { ascending: false })

  const { data: props } = await supabase.from('properties').select('id, name, photo_path')
  const propMap = new Map((props ?? []).map((p) => [p.id, p]))
  const submissions = (subs ?? []).map((s) => {
    const prop = propMap.get(s.property_id)
    return {
      report_id: s.report_id,
      title: s.title,
      issue_type: s.issue_type,
      priority: s.priority,
      status: s.status,
      assignee_group: s.assignee_group,
      created_at: s.created_at,
      property_name: prop?.name ?? null,
      property_photo: propertyPhotoUrl(prop?.photo_path),
    }
  })

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Submissions</h1>
      <p className="mt-1 text-sm text-gray-500">Issues across your properties — click a column header to sort.</p>
      <SubmissionsTable submissions={submissions} />
    </main>
  )
}