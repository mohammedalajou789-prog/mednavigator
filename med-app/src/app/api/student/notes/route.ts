import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // FIX: auth + body parsed in parallel
    const [{ data: { user } }, body] = await Promise.all([
      supabase.auth.getUser(),
      request.json(),
    ])

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { lecture_id, note_content } = body

    if (!lecture_id) {
      return NextResponse.json({ error: 'Missing lecture_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_notes')
      .upsert({
        user_id: profile.id,
        lecture_id,
        note_content: note_content ?? '',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lecture_id',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Notes error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}