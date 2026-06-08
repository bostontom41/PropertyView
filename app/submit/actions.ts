'use server'

import { createClient } from '@/lib/supabase/server'

export async function createSubmission(formData: {
  title: string
  issueType: string
  priority: string
  location: string
  notes: string
  photos: { name: string; type: string; base64: string }[]
}) {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, property_id')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'No profile found for your account.' }

  let propertyId = profile.property_id
  if (!propertyId) {
    const { data: firstProp } = await supabase
      .from('properties').select('id').order('name').limit(1).single()
    propertyId = firstProp?.id ?? null
  }
  if (!propertyId) return { error: 'No property available to file against.' }

  // 1. Create the submission row (trigger generates report_id)
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
      // Submission saved, but a photo failed — report it, don't lose the ticket
      return { reportId, photoError: upErr.message }
    }
  }

  return { reportId }
}