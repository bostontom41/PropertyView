'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyNewSubmission } from '@/lib/notify'

export async function createSubmission(formData: {
  title: string
  issueType: string
  priority: string
  location: string
  notes: string
  propertyId?: string | null
}) {
  const supabase = await createClient()

  const propertyId = formData.propertyId
  if (!propertyId) {
    return { error: 'No property specified. Start a submission from a property page.' }
  }

  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub ?? null

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
    .select('id, report_id')
    .single()

  if (error) return { error: error.message }
  const submissionId = created.id
  const reportId = created.report_id

  if (formData.notes && formData.notes.trim().length > 0) {
    await supabase.from('submission_notes').insert({
      submission_id: submissionId,
      author_id: userId,
      kind: 'creation',
      body: formData.notes.trim(),
    })
  }

  await notifyNewSubmission(submissionId)

  return { reportId }
}