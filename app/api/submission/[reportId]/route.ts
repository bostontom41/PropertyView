import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params
  const supabase = await createClient()

  const { data: s } = await supabase
    .from('submissions')
    .select('id, report_id, title, issue_type, priority, status, requires_bid, assignee_group, location, notes, created_at, property_id')
    .eq('report_id', reportId)
    .single()

  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: property } = await supabase
    .from('properties').select('name').eq('id', s.property_id).single()

  const { data: notes } = await supabase
    .from('submission_notes')
    .select('id, kind, body, created_at, author_id')
    .eq('submission_id', s.id)
    .order('created_at', { ascending: true })

  const { data: profs } = await supabase.from('profiles').select('id, email')
  const authorEmail = Object.fromEntries((profs ?? []).map((p) => [p.id, p.email]))

  // List + sign the submission's photos (private bucket, folder = report_id)
  const { data: files } = await supabase.storage
    .from('submission-photos')
    .list(reportId, { limit: 50 })

  const photoUrls: string[] = []
  for (const f of files ?? []) {
    if (f.name === '.emptyFolderPlaceholder') continue
    const { data: signed } = await supabase.storage
      .from('submission-photos')
      .createSignedUrl(`${reportId}/${f.name}`, 60 * 10) // 10 min
    if (signed?.signedUrl) photoUrls.push(signed.signedUrl)
  }

  return NextResponse.json({
    submission: s,
    propertyName: property?.name ?? null,
    notes: notes ?? [],
    authorEmail,
    photos: photoUrls,
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params
  const supabase = await createClient()
  const body = await req.json()

  const { data: s } = await supabase
    .from('submissions').select('id').eq('report_id', reportId).single()
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub ?? null

  if (body.action === 'triage') {
    // Read current values so we can describe the change
    const { data: before } = await supabase
      .from('submissions').select('status, assignee_group').eq('report_id', reportId).single()

    const { error } = await supabase
      .from('submissions').update(body.updates).eq('report_id', reportId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Log a feed event for status or assignment changes (not requires_bid alone)
    let eventKind: string | null = null
    let eventBody: string | null = null
    if (body.updates.status && body.updates.status !== before?.status) {
      eventKind = 'status_change'
      eventBody = `Status changed from ${(before?.status ?? 'new').replace('_', ' ')} to ${body.updates.status.replace('_', ' ')}`
    } else if (body.updates.assignee_group && body.updates.assignee_group !== before?.assignee_group) {
      eventKind = 'assignment_change'
      eventBody = `Assigned to ${body.updates.assignee_group}`
    }
    if (eventKind && eventBody) {
      await supabase.from('submission_notes').insert({
        submission_id: s.id, author_id: userId, kind: eventKind, body: eventBody,
      })
    }
  } else if (body.action === 'note') {
    const { error } = await supabase.from('submission_notes').insert({
      submission_id: s.id, author_id: userId, kind: 'comment', body: body.text,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}