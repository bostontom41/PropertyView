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

export async function saveContact(
  propertyId: string,
  contact: {
    id?: string
    name: string
    role: string
    phone: string
    email: string
    is_primary: boolean
    notes: string
  }
) {
  const supabase = await createClient()

  // Enforce a single primary per property: if this one is primary, clear the others
  if (contact.is_primary) {
    await supabase
      .from('property_contacts')
      .update({ is_primary: false })
      .eq('property_id', propertyId)
  }

  const payload = {
    property_id: propertyId,
    name: contact.name.trim(),
    role: contact.role.trim() || null,
    phone: contact.phone.trim() || null,
    email: contact.email.trim() || null,
    is_primary: contact.is_primary,
    notes: contact.notes.trim() || null,
  }

  const { error } = contact.id
    ? await supabase.from('property_contacts').update(payload).eq('id', contact.id)
    : await supabase.from('property_contacts').insert(payload)

  if (error) return { error: error.message }
  revalidatePath(`/portal/properties/${propertyId}`)
  return { ok: true }
}

export async function deleteContact(propertyId: string, contactId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('property_contacts').delete().eq('id', contactId)
  if (error) return { error: error.message }
  revalidatePath(`/portal/properties/${propertyId}`)
  return { ok: true }
}

export async function uploadAttachment(
  propertyId: string,
  file: { name: string; type: string; size: number; base64: string }
) {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub ?? null

  const buffer = Buffer.from(file.base64, 'base64')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${propertyId}/${Date.now()}-${safeName}`

  const { error: upErr } = await supabase.storage
    .from('property-documents')
    .upload(path, buffer, { contentType: file.type })

  if (upErr) return { error: upErr.message }

  const { error: dbErr } = await supabase.from('property_attachments').insert({
    property_id: propertyId,
    file_name: file.name,
    storage_path: path,
    file_type: file.type || null,
    file_size: file.size || null,
    uploaded_by: userId,
  })

  if (dbErr) return { error: dbErr.message }

  revalidatePath(`/portal/properties/${propertyId}`)
  return { ok: true }
}

export async function getAttachmentUrl(storagePath: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('property-documents')
    .createSignedUrl(storagePath, 60 * 5) // valid 5 minutes
  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

export async function deleteAttachment(propertyId: string, attachmentId: string, storagePath: string) {
  const supabase = await createClient()
  await supabase.storage.from('property-documents').remove([storagePath])
  const { error } = await supabase.from('property_attachments').delete().eq('id', attachmentId)
  if (error) return { error: error.message }
  revalidatePath(`/portal/properties/${propertyId}`)
  return { ok: true }
}