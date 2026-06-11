'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadPropertyPhoto(
  propertyId: string,
  photo: { name: string; type: string; base64: string }
) {
  const supabase = await createClient()

  const ext = photo.name.split('.').pop() || 'jpg'
  const path = `${propertyId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(photo.base64, 'base64')

  const { error: upErr } = await supabase.storage
    .from('property-photos')
    .upload(path, buffer, { contentType: photo.type, upsert: true })

  if (upErr) return { error: upErr.message }

  const { error: dbErr } = await supabase
    .from('properties')
    .update({ photo_path: path })
    .eq('id', propertyId)

  if (dbErr) return { error: dbErr.message }

  revalidatePath(`/portal/properties/${propertyId}`)
  return { ok: true }
}

export async function updateProperty(id: string, updates: Record<string, any>) {
  const supabase = await createClient()
  const { error } = await supabase.from('properties').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/portal/properties/${id}`)
  return { ok: true }
}