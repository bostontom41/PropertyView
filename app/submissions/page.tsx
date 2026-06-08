import { createClient } from '@/lib/supabase/server'
import SubmissionsList from './list'

export const dynamic = 'force-dynamic'

export default async function SubmissionsPage() {
  const supabase = await createClient()
  const { data: submissions } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Submissions</h1>
      <p className="mt-1 text-sm text-gray-500">
        Issues you have access to, newest first.
      </p>
      <SubmissionsList submissions={submissions ?? []} />
    </main>
  )
}