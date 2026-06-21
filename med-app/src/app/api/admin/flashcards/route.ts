import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lecture_id, flashcards } = await req.json()
  if (!lecture_id || !flashcards?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const rows = flashcards.map((f: { front_text: string; back_text: string; tags: string[] }, index: number) => ({
    lecture_id,
    front_text: f.front_text,
    back_text: f.back_text,
    tags: f.tags ?? [],
    display_order: index,
  }))

  const { error } = await supabase.from('flashcards').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}