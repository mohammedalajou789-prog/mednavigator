import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lectureId = searchParams.get('lectureId')
  const subjectId = searchParams.get('subjectId')
  const tab       = searchParams.get('tab') ?? 'sheet'

  if (!lectureId || !subjectId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const supabase = await createServerClient()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  let userId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    userId = profile?.id ?? null
  }

  // ── Access check ──────────────────────────────────────────────────────────
  const { allowed } = await checkUserAccess(subjectId, userId)

  // ── Fetch requested tab content ───────────────────────────────────────────
  if (tab === 'sheet') {
    if (!allowed) return NextResponse.json({ locked: true, data: null })
    const { data } = await supabase
      .from('sheets')
      .select('id, title, content, status, updated_at')
      .eq('lecture_id', lectureId)
      .eq('status', 'published')
      .maybeSingle()

    const imageSlots: Record<number, string> = {}
    if (data?.id) {
      const { data: slots, error: slotsError } = await supabase
        .from('image_slots')
        .select('slot_number, media_library!image_slots_media_id_fkey(file_url)')
        .eq('entity_type', 'sheet')
        .eq('entity_id', data.id)

      if (slotsError) {
        console.error('image_slots fetch error:', slotsError)
      }

      if (slots) {
        for (const slot of slots) {
          const media = slot.media_library as unknown as { file_url: string } | null
          if (media?.file_url) imageSlots[Number(slot.slot_number)] = media.file_url
        }
      }
    }
    return NextResponse.json({ locked: false, data, imageSlots })
  }

  if (tab === 'summary') {
    if (!allowed) return NextResponse.json({ locked: true, data: null })
    const { data } = await supabase
      .from('summaries')
      .select('id, title, content, status, updated_at')
      .eq('lecture_id', lectureId)
      .eq('status', 'published')
      .maybeSingle()

    const imageSlots: Record<number, string> = {}
    if (data?.id) {
      const { data: slots, error: slotsError } = await supabase
        .from('image_slots')
        .select('slot_number, media_library!image_slots_media_id_fkey(file_url)')
        .eq('entity_type', 'summary')
        .eq('entity_id', data.id)

      if (slotsError) {
        console.error('image_slots fetch error (summary):', slotsError)
      }

      if (slots) {
        for (const slot of slots) {
          const media = slot.media_library as unknown as { file_url: string } | null
          if (media?.file_url) imageSlots[Number(slot.slot_number)] = media.file_url
        }
      }
    }

    return NextResponse.json({ locked: false, data, imageSlots })
  }

  if (tab === 'flashcards') {
    if (!allowed) return NextResponse.json({ locked: true, data: null })
    const { data } = await supabase
      .from('flashcards')
      .select('id, front_text, back_text, tags, display_order')
      .eq('lecture_id', lectureId)
      .order('display_order')
    return NextResponse.json({ locked: false, data: data ?? [] })
  }

  if (tab === 'quiz') {
    if (!allowed) return NextResponse.json({ locked: true, data: null })
    const { data } = await supabase
      .from('quiz_questions')
      .select('id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, tags')
      .eq('lecture_id', lectureId)
    return NextResponse.json({ locked: false, data: data ?? [] })
  }

  if (tab === 'previous_years') {
    if (!allowed) return NextResponse.json({ locked: true, data: null })
    const { data } = await supabase
      .from('previous_year_questions')
      .select('id, question, options, correct_answer, explanation, exam_year, exam_type')
      .eq('lecture_id', lectureId)
    return NextResponse.json({ locked: false, data: data ?? [] })
  }

  return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
}