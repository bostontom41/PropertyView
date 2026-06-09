import { formatFiled } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { TicketLink } from './drawer-context'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  bid_process: 'bg-teal-100 text-teal-700',
  resolved: 'bg-green-100 text-green-700',
  
}
const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-gray-100 text-gray-600',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('submissions')
    .select('report_id, title, priority, status, created_at, property_id')
    .order('created_at', { ascending: false })

  const { data: props } = await supabase.from('properties').select('id, name')
  const propName = new Map((props ?? []).map((p) => [p.id, p.name]))
  const { data: feedEvents } = await supabase
  .from('submission_notes')
  .select('id, kind, body, created_at, submission_id')
  .in('kind', ['creation', 'status_change', 'assignment_change'])
  .order('created_at', { ascending: false })
  .limit(15)

// Map submission_id → report_id + title for display
const { data: subIndex } = await supabase
  .from('submissions')
  .select('id, report_id, title')
const subInfo = new Map((subIndex ?? []).map((s) => [s.id, s]))
  const all = subs ?? []
  const kpis = [
    { label: 'Open Submissions', value: all.filter((s) => s.status !== 'resolved').length },
    { label: 'High Priority Open', value: all.filter((s) => s.priority === 'high' && s.status !== 'resolved').length },
    { label: 'New (Untriaged)', value: all.filter((s) => s.status === 'new').length },
    { label: 'Resolved', value: all.filter((s) => s.status === 'resolved').length },
  ]
  const recent = all.slice(0, 10)

  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Operations Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Live view across your properties.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-3xl font-bold text-gray-900">{k.value}</div>
            <div className="mt-1 text-sm text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* LEFT: submissions table */}
        <div>
          <h2 className="font-semibold">Recent Submissions</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Report</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Title</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Property</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.report_id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <TicketLink reportId={s.report_id} className="cursor-pointer font-mono text-xs font-medium text-gray-700 hover:text-brand hover:underline" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-3 text-gray-700">{propName.get(s.property_id) ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium uppercase ${PRIORITY_STYLE[s.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatFiled(s.created_at)}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No submissions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: rail */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="font-semibold">Property Map</h2>
            <div className="mt-3 flex h-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
              Map — coming next
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Activity Feed</h2>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
              </span>
            </div>
            <ul className="mt-3 space-y-3">
              {(feedEvents ?? []).map((e) => {
                const sub = subInfo.get(e.submission_id)
                const dot =
                  e.kind === 'creation' ? 'bg-blue-500'
                  : e.kind === 'status_change' ? 'bg-amber-500'
                  : 'bg-teal-500'
                return (
                  <li key={e.id} className="flex gap-2.5">
                    <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700">
                        {e.kind === 'creation' ? (
                          <><span className="font-medium text-gray-900">{sub?.title ?? 'Ticket'}</span> submitted</>
                        ) : (
                          <><span className="font-medium text-gray-900">{sub?.report_id ?? ''}</span> — {e.body}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{formatFiled(e.created_at)}</p>
                    </div>
                  </li>
                )
              })}
              {(feedEvents ?? []).length === 0 && (
                <li className="text-sm text-gray-400">No recent activity.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}