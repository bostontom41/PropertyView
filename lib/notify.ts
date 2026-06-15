import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const FROM = 'Homeside PropertyView <alerts@tdh-sandbox.com>'

export async function notifyNewSubmission(submissionId: string) {
  // Guard: if no API key configured, skip silently (e.g. local without key)
  if (!process.env.RESEND_API_KEY) return

  const supabase = await createClient()

  // Load the submission + its property
  const { data: sub } = await supabase
    .from('submissions')
    .select('report_id, title, issue_type, priority, requires_bid, location, notes, property_id')
    .eq('id', submissionId)
    .single()
  if (!sub) return

  const { data: property } = await supabase
    .from('properties')
    .select('name, manager_email, regional_manager_email')
    .eq('id', sub.property_id)
    .single()
  if (!property) return

  // Build recipient set
  const recipients = new Set<string>()

  // Property manager — always
  if (property.manager_email) recipients.add(property.manager_email)

  // Regional manager — only on high priority
  if (sub.priority === 'high' && property.regional_manager_email) {
    recipients.add(property.regional_manager_email)
  }

  // Global routing rules — match on issue type, high priority, or requires-bid
  const { data: rules } = await supabase
    .from('routing_rules')
    .select('recipient_email, issue_types, on_high_priority, on_requires_bid')

  for (const r of rules ?? []) {
    const typeMatch = (r.issue_types ?? []).includes(sub.issue_type)
    const priorityMatch = r.on_high_priority && sub.priority === 'high'
    const bidMatch = r.on_requires_bid && sub.requires_bid
    if (typeMatch || priorityMatch || bidMatch) {
      if (r.recipient_email) recipients.add(r.recipient_email)
    }
  }

  if (recipients.size === 0) return

  const subjectPriority = sub.priority === 'high' ? '[HIGH PRIORITY] ' : ''
  const subject = `${subjectPriority}New ticket ${sub.report_id} — ${property.name}`
  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="color:#002144;">New Submission — ${sub.report_id}</h2>
      <p><strong>${sub.title}</strong></p>
      <table style="font-size:14px; color:#333;">
        <tr><td style="padding:2px 12px 2px 0; color:#888;">Property</td><td>${property.name}</td></tr>
        <tr><td style="padding:2px 12px 2px 0; color:#888;">Type</td><td>${sub.issue_type}</td></tr>
        <tr><td style="padding:2px 12px 2px 0; color:#888;">Priority</td><td>${sub.priority}</td></tr>
        <tr><td style="padding:2px 12px 2px 0; color:#888;">Location</td><td>${sub.location ?? '—'}</td></tr>
        <tr><td style="padding:2px 12px 2px 0; color:#888;">Requires bid</td><td>${sub.requires_bid ? 'Yes' : 'No'}</td></tr>
      </table>
      <p style="font-size:14px; color:#333; white-space:pre-wrap;">${sub.notes ?? ''}</p>
    </div>
  `

  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: FROM,
      to: Array.from(recipients),
      subject,
      html,
    })
  } catch (err) {
    console.error('Notification email failed:', err)
  }
}