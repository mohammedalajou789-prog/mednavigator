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

  // Step 1 — Delete all existing questions for this lecture
  const { error: deleteError } = await supabase
    .from('previous_year_questions')
    .delete()
    .eq('lecture_id', lecture_id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Step 2 — Insert the new questions
  const rows = questions.map((q: {
    question: string
    options: string[]
    correct_answer: string
    explanation: string
    exam_year: number | ''
    exam_type: string
    batch_name: string
  }) => ({
    lecture_id,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
    exam_year: q.exam_year || null,
    exam_type: q.exam_type,
    batch_name: q.batch_name || null,
  }))

  const { error } = await supabase.from('previous_year_questions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
