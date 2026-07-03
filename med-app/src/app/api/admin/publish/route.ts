import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const profile = await requireAuth()
    if (profile.role !== 'admin' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { type, id, action } = await req.json()
    // type: 'lecture' | 'chapter'
    // action: 'publish' | 'unpublish'

    const supabase = await createServerClient()

    if (type === 'lecture') {
      const newStatus = action === 'publish' ? 'published' : 'draft'
      const { error } = await supabase
        .from('lectures')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (type === 'chapter') {
      const { error } = await supabase
        .from('chapters')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}