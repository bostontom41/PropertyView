'use server'

import { createClient } from '@/lib/supabase/server'

export async function createSubmission(formData: {
  title: string
  issueType: string
  priority: string
  location: string
  notes: string
}) {
  const supabase = await createClient()

// Who is this user, and what property are they tied to?
const { data: claims } = await supabase.auth.getClaims()
const userId = claims?.claims?.sub

const { data: profile } = await supabase
  .from('profiles')
  .select('role, property_id')
  .eq('id', userId)
  .single()
  if (!profile) {
    return { error: 'No profile found for your account.' }
  }

  // Scoped roles file against their own property; global roles must pick one.
  // For now (admin/regional with no property), fall back to the first property.
  let propertyId = profile.property_id
  if (!propertyId) {
    const { data: firstProp } = await supabase
      .from('properties').select('id').order('name').limit(1).single()
    propertyId = firstProp?.id ?? null
  }

  if (!propertyId) {
    return { error: 'No property available to file against.' }
  }

  const { data, error } = await supabase
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
  return { reportId: data.report_id }
}