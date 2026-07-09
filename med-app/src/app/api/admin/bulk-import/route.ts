import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { parseFlashcards, parseQuizQuestions, parsePYQ } from '@/lib/utils/mn-parser'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, lecture_id, raw_text } = body

    if (!type || !lecture_id || !raw_text) {
      return NextResponse.json(
        { error: 'Missing required fields: type, lecture_id, raw_text' },
        { status: 400 }
      )
    }

    if (type === 'flashcards') {
      const result = parseFlashcards(raw_text)

      if (result.items.length === 0) {
        return NextResponse.json(
          { error: 'No valid cards found. Check your syntax.', parse_errors: result.errors },
          { status: 400 }
        )
      }

      const records = result.items.map(item => ({
        lecture_id,
        front_text: item.front_text,
        back_text: item.back_text,
        tags: item.tags,
        display_order: item.display_order,
      }))

      const { data, error } = await supabase
        .from('flashcards')
        .insert(records)
        .select()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ success: true, imported: data.length, parse_errors: result.errors })
    }

    if (type === 'quiz') {
      const result = parseQuizQuestions(raw_text)

      if (result.items.length === 0) {
        return NextResponse.json(
          { error: 'No valid questions found. Check your syntax.', parse_errors: result.errors },
          { status: 400 }
        )
      }

      const records = result.items.map(item => ({
        lecture_id,
        question: item.question,
        option_a: item.option_a,
        option_b: item.option_b,
        option_c: item.option_c,
        option_d: item.option_d,
        option_e: item.option_e,
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        tags: item.tags,
      }))

      const { data, error } = await supabase
        .from('quiz_questions')
        .insert(records)
        .select()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ success: true, imported: data.length, parse_errors: result.errors })
    }

    if (type === 'pyq') {
      const result = parsePYQ(raw_text)

      if (result.items.length === 0) {
        return NextResponse.json(
          { error: 'No valid PYQs found. Check your syntax.', parse_errors: result.errors },
          { status: 400 }
        )
      }

      const records = result.items.map(item => ({
        lecture_id,
        question: item.question,
        options: item.options,
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        exam_year: item.exam_year,
        exam_type: item.exam_type,
        batch_name: item.batch_name,
      }))

      const { data, error } = await supabase
        .from('previous_year_questions')
        .insert(records)
        .select()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ success: true, imported: data.length, parse_errors: result.errors })
    }

    return NextResponse.json({ error: 'Invalid type. Use: flashcards, quiz, or pyq' }, { status: 400 })

  } catch (err) {
    console.error('Bulk import error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}