'use server'

import { createClient } from '@/lib/supabase/server'

export async function createSubmission(formData: {
  title: string
  issueType: string
  priority: string
  location: string
  notes: string
  photos: { name: string; type: string; base64: string }[]
  propertyId?: string | null
}) {
  const supabase = await createClient()

  const propertyId = formData.propertyId
  if (!propertyId) {
    return { error: 'No property specified. Start a submission from a property page.' }
  }

  // 1. Create the submission row (trigger generates report_id).
  //    RLS rejects this insert if the user isn't allowed to file for this property,
  //    so the database is the access gate — no need to re-check here.
  const { data: created, error } = await supabase
    .from('submissions')
    .insert({
      property_id: propertyId,
      title: formData.title,
      issue_type: formData.issueType,
      priority: formData.priority,
      location: formData.location || null,
      notes: formData.notes || null,
    })
    .select('report_id')
    .single()

  if (error) return { error: error.message }
  const reportId = created.report_id

  // 2. Upload each photo into a folder named after the report_id
  for (let i = 0; i < formData.photos.length; i++) {
    const photo = formData.photos[i]
    const buffer = Buffer.from(photo.base64, 'base64')
    const ext = photo.name.split('.').pop() || 'jpg'
    const path = `${reportId}/${Date.now()}-${i}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('submission-photos')
      .upload(path, buffer, { contentType: photo.type })

    if (upErr) {
      return { reportId, photoError: upErr.message }
    }
  }

  return { reportId }
}