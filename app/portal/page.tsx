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

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from('submissions')
    .select('report_id, title, priority, status, created_at, property_id')
    .order('created_at', { ascending: false })

  const { data: props } = await supabase.from('properties').select('id, name')
  const propName = new Map((props ?? []).map((p) => [p.id, p.name]))

  const all = subs ?? []
  const kpis = [
    { label: 'Open Submissions', value: all.filter((s) => s.status !== 'resolved').length },
    { label: 'High Priority Open', value: all.filter((s) => s.priority === 'high' && s.status !== 'resolved').length },
    { label: 'New (Untriaged)', value: all.filter((s) => s.status === 'new').length },
    { label: 'Resolved', value: all.filter((s) => s.status === 'resolved').length },
  ]
  const recent = all.slice(0, 10)

  return (
    <main className="mx-auto max-w-5xl p-6">
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

      <h2 className="mt-10 font-semibold">Recent Submissions</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Report</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Title</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Property</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Priority</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.report_id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <TicketLink reportId={s.report_id} className="cursor-pointer font-mono text-xs font-medium text-gray-500 hover:text-brand hover:underline" />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                <td className="px-4 py-3 text-gray-600">{propName.get(s.property_id) ?? '—'}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{s.priority}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatFiled(s.created_at)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No submissions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}