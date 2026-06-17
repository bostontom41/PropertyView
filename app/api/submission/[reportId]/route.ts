import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const ANALYZE_PROMPT = `You are assisting a property-maintenance team by reviewing photos a field worker took on site and attached to a maintenance ticket. These tickets usually involve a significant issue needing visibility and possibly a bid or a dispatched contractor — for example water losses (burst pipes, water heater failures), fire or smoke damage, or mold-like growth. You are given the photos and a summary of what was reported. Your role is strictly advisory: give a quick read of what is visibly present, check it against what was reported, and tell the on-site worker what additional information would help a human decide next steps. You do NOT make authoritative determinations.

Rules:
- Lead with a brief, plain-language read of what the photos appear to show, using hedged language ("appears to be", "looks consistent with"). Never state a conclusion as established fact.
- You may give a visual impression such as "appears to be mold-like growth" or "appears to be water damage", but go no further. Do NOT name a mold species or its toxicity, assign any water damage category (for example Category 1/2/3) or IICRC classification, or make any insurance, legal, code-compliance, health, or safety determination. Those require a qualified human.
- Keep it concise and directive. This is for a worker standing on site, not a written report. Favor short sentences.
- Judge whether the photos appear consistent with what was reported; if they do not appear to show the reported issue, say so plainly.
- Give specific, actionable next steps addressed to the worker: the concrete photos to capture and the measurements or details to add to the ticket notes that a contractor or estimator would need. The right next steps depend entirely on what you actually see. The following are illustrations of the level of specificity to aim for — NOT a checklist to run through, and NOT tied to the reported type:
    - Water losses: locate and photograph the suspected source if you can find it; note whether standing water is present and roughly how much; note whether affected materials feel wet or dry; capture how far it appears to have spread (ceiling, walls, flooring, baseboards).
    - Fire or smoke: photograph the extent of charring and smoke staining; note which materials and roughly what area are affected.
    - Mold-like growth: add the approximate square footage of the visible affected area to the notes; photograph any nearby moisture source; note whether the surface feels damp.
  Tailor every next step to the specific photos in front of you, and do NOT ask for anything the photos or the report already make clear.
- Always also note, when relevant: if the damage appears to affect more than one area, ask the worker to record each affected unit, room, or area number in the notes; and if the damage appears significant, ask whether the tenant will need to be temporarily relocated.
- If image quality, lighting, or framing limits what you can tell, say so plainly.

Write your response as plain text in exactly this structure, with no other headings, preamble, or closing remarks:

Quick read:
<1 to 2 sentences: what this appears to be, hedged>

Consistency with the report:
<1 sentence on whether the photos appear consistent with what was reported; flag any mismatch>

Recommended next steps:
1. <a specific photo to take, measurement to record, or detail to add to the notes>
2. <...>
3. <...>

(Include 3 to 5 next steps total, each concrete and addressed to the on-site worker.)`

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
  } else if (body.action === 'analyze') {
    // Gather the ticket's photos as signed URLs (same pattern as GET above)
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

    if (photoUrls.length === 0) {
      return NextResponse.json(
        { error: 'No photos on this ticket to analyze.' },
        { status: 400 }
      )
    }

    // Pull the human-reported context: ticket details + any descriptive notes.
    // We deliberately exclude ai_assessment notes so the model never reads its
    // own prior output (avoids a feedback loop).
    const { data: detail } = await supabase
      .from('submissions')
      .select('title, issue_type, priority, location, notes')
      .eq('report_id', reportId)
      .single()

    const { data: humanNotes } = await supabase
      .from('submission_notes')
      .select('kind, body, created_at')
      .eq('submission_id', s.id)
      .in('kind', ['creation', 'intake', 'comment'])
      .order('created_at', { ascending: true })

    const reportLines = [
      detail?.title ? `Title: ${detail.title}` : null,
      detail?.issue_type ? `Issue type: ${detail.issue_type}` : null,
      detail?.priority ? `Priority: ${detail.priority}` : null,
      detail?.location ? `Location: ${detail.location}` : null,
      detail?.notes ? `Description: ${detail.notes}` : null,
    ].filter(Boolean)

    const commentLines = (humanNotes ?? [])
      .map((n) => n.body?.trim())
      .filter(Boolean)

    const reportContext =
      'Here is what the person who filed this maintenance ticket reported. Treat it as context to verify against the photos — do not simply assume it is accurate.\n\n' +
      (reportLines.length ? reportLines.join('\n') : 'No ticket details were provided.') +
      (commentLines.length
        ? '\n\nAdditional notes/comments on the ticket:\n- ' + commentLines.join('\n- ')
        : '')

    let assessment: string
    try {
      const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY from env
      const imageBlocks = photoUrls.map((url) => ({
        type: 'image' as const,
        source: { type: 'url' as const, url },
      }))

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text' as const, text: reportContext + '\n\n' + ANALYZE_PROMPT },
            ],
          },
        ],
      })

      assessment = msg.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('')
        .trim()
    } catch (err) {
      console.error('AI analyze failed:', err)
      return NextResponse.json(
        { error: 'AI analysis failed. Check the server logs.' },
        { status: 500 }
      )
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'AI returned an empty result.' },
        { status: 500 }
      )
    }

    const { error } = await supabase.from('submission_notes').insert({
      submission_id: s.id, author_id: userId, kind: 'ai_assessment', body: assessment,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true, assessment })
  }

  return NextResponse.json({ ok: true })
}