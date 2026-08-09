import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      p_user_id,
      p_lecture_id,
      p_active_tab,
      p_sheet_scroll    = null,
      p_summary_scroll  = null,
      p_flashcard_index = null,
      p_quiz_index      = null,
      p_pyq_index       = null,
    } = body

    if (!p_user_id || !p_lecture_id || !p_active_tab) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServerClient()

    await (supabase as any).rpc('save_resume_state', {
      p_user_id,
      p_lecture_id,
      p_active_tab,
      p_sheet_scroll,
      p_summary_scroll,
      p_flashcard_index,
      p_quiz_index,
      p_pyq_index,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
