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

  return NextResponse.json({ submission: s, propertyName: property?.name ?? null, notes: notes ?? [], authorEmail })
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
      const { error } = await supabase
        .from('submissions').update(body.updates).eq('report_id', reportId)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    } else if (body.action === 'note') {
      const { error } = await supabase.from('submission_notes').insert({
        submission_id: s.id, author_id: userId, kind: 'comment', body: body.text,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }
  
    return NextResponse.json({ ok: true })
  }