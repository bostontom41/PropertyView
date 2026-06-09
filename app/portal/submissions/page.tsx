import { createClient } from '@/lib/supabase/server'
import SubmissionsList from '@/app/submissions/list'

export const dynamic = 'force-dynamic'

export default async function PortalSubmissionsPage() {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, created_at, property_id')
    .order('created_at', { ascending: false })

    const { data: props } = await supabase.from('properties').select('id, name, photo_path')
    const propMap = new Map((props ?? []).map((p) => [p.id, p]))
    const { propertyPhotoUrl } = await import('@/lib/format')
    const submissions = (subs ?? []).map((s) => {
      const prop = propMap.get(s.property_id)
      return { ...s, property_name: prop?.name ?? null, property_photo: propertyPhotoUrl(prop?.photo_path) }
    })
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Submissions</h1>
      <p className="mt-1 text-sm text-gray-500">Issues across your properties, newest first.</p>
      <SubmissionsList submissions={submissions} />
    </main>
  )
}