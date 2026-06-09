'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProperty(formData: {
  name: string
  address: string
  managerName: string
  managerEmail: string
}) {
  const supabase = await createClient()

  if (!formData.name.trim() || !formData.address.trim()) {
    return { error: 'Name and address are required.' }
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      name: formData.name.trim(),
      address: formData.address.trim(),
      manager_name: formData.managerName.trim() || null,
      manager_email: formData.managerEmail.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/portal/properties/${data.id}`)
}