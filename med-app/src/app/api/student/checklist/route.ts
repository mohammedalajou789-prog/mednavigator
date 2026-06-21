import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { lecture_id, stars } = body

    if (!lecture_id || stars === undefined) {
      return NextResponse.json({ error: 'Missing lecture_id or stars' }, { status: 400 })
    }

    if (stars < 0 || stars > 3) {
      return NextResponse.json({ error: 'Stars must be between 0 and 3' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('checklist_progress')
      .upsert({
        user_id: profile.id,
        lecture_id,
        stars,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lecture_id',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Checklist error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}