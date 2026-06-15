'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveRoutingRule(rule: {
  id?: string
  label: string
  recipient_email: string
  issue_types: string[]
  on_high_priority: boolean
  on_requires_bid: boolean
}) {
  const supabase = await createClient()

  const payload = {
    label: rule.label.trim(),
    recipient_email: rule.recipient_email.trim(),
    issue_types: rule.issue_types,
    on_high_priority: rule.on_high_priority,
    on_requires_bid: rule.on_requires_bid,
  }

  const { error } = rule.id
    ? await supabase.from('routing_rules').update(payload).eq('id', rule.id)
    : await supabase.from('routing_rules').insert(payload)

  if (error) return { error: error.message }
  revalidatePath('/portal/routing')
  return { ok: true }
}

export async function deleteRoutingRule(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('routing_rules').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/portal/routing')
  return { ok: true }
}