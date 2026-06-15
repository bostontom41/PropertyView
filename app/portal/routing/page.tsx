import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import RoutingRules from './routing-rules'

export const dynamic = 'force-dynamic'

export default async function RoutingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/portal')

  const supabase = await createClient()
  const { data: rules } = await supabase
    .from('routing_rules')
    .select('id, label, recipient_email, issue_types, on_high_priority, on_requires_bid')
    .order('label')

  return (
    <main className="mx-auto max-w-3xl p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Routing Rules</h1>
      <p className="mt-1 text-sm text-gray-500">
        Notify outside teams based on ticket conditions, system-wide. The property manager (and regional manager on high-priority) are notified automatically per property.
      </p>
      <RoutingRules rules={rules ?? []} />
    </main>
  )
}