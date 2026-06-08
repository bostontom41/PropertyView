import TriagePanel from './triage'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const supabase = await createClient()

  const { data: s } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, status, requires_bid, assignee_group, location, notes, created_at, updated_at')
    .eq('report_id', reportId)
    .single()

  if (!s) notFound()

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/submissions" className="text-sm text-gray-500 hover:underline">
        ← Back to submissions
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">{s.title}</h1>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
          {s.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{s.report_id}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Issue Type</dt>
          <dd className="capitalize">{s.issue_type}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Priority</dt>
          <dd className="capitalize">{s.priority}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Assignee Group</dt>
          <dd className="capitalize">{s.assignee_group ?? '— not yet triaged'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Requires Bid</dt>
          <dd>{s.requires_bid ? 'Yes' : 'No'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Location</dt>
          <dd>{s.location ?? '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-gray-500">Notes</dt>
          <dd className="whitespace-pre-wrap">{s.notes ?? '—'}</dd>
        </div>
      </dl>
      <TriagePanel
        reportId={s.report_id}
        status={s.status}
        assigneeGroup={s.assignee_group}
        requiresBid={s.requires_bid}
      />
    </main>
  )
}