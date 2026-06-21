import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lecture_id, questions } = await req.json()
  if (!lecture_id || !questions?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const rows = questions.map((q: {
    question: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    option_e: string
    correct_answer: string
    explanation: string
    tags: string[]
  }) => ({
    lecture_id,
    question: q.question,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    option_e: q.option_e || null,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    tags: q.tags ?? [],
  }))

  const { error } = await supabase.from('quiz_questions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}