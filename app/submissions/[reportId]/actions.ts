'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSubmission(
  reportId: string,
  updates: {
    status?: string
    assignee_group?: string | null
    requires_bid?: boolean
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('report_id', reportId)

  if (error) return { error: error.message }

  revalidatePath(`/submissions/${reportId}`)
  return { ok: true }
}