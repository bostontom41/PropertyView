'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/portal/team')
  return { ok: true }
}

export async function setUserProperties(userId: string, propertyIds: string[]) {
  const supabase = await createClient()
  // Replace the user's assignments: clear existing, insert the new set
  const { error: delErr } = await supabase.from('user_properties').delete().eq('user_id', userId)
  if (delErr) return { error: delErr.message }
  if (propertyIds.length > 0) {
    const rows = propertyIds.map((pid) => ({ user_id: userId, property_id: pid }))
    const { error: insErr } = await supabase.from('user_properties').insert(rows)
    if (insErr) return { error: insErr.message }
  }
  revalidatePath('/portal/team')
  return { ok: true }
}