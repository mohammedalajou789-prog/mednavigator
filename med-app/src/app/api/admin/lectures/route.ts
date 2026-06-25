import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createLecture } from '@/lib/services/lectures'
import { createLectureSchema } from '@/lib/validations/content'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createLectureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { subject_id, chapter_id, sub_subject_id } = body as {
    subject_id?: string
    chapter_id?: string
    sub_subject_id?: string
  }

  if (!subject_id) {
    return NextResponse.json({ error: 'subject_id is required' }, { status: 400 })
  }

  if (!chapter_id && !sub_subject_id) {
    return NextResponse.json(
      { error: 'Either chapter_id or sub_subject_id is required' },
      { status: 400 }
    )
  }

  if (profile.role === 'admin') {
    const { data: assignment } = await supabase
      .from('admin_assignments')
      .select('id')
      .eq('user_id', profile.id)
      .eq('subject_id', subject_id)
      .eq('is_active', true)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to this subject' }, { status: 403 })
    }
  }

  const { data, error } = await createLecture({
    subject_id,
    chapter_id: chapter_id ?? undefined,
    sub_subject_id: sub_subject_id ?? undefined,
    title: parsed.data.title,
    description: parsed.data.description || undefined,
    is_preview: parsed.data.is_preview ?? false,
  })

  if (error) {
    console.error('createLecture error:', error)
    return NextResponse.json({ error: 'Failed to create lecture' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}