import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    name,
    description,
    subject_type,
    category,
    access_mode,
    price,
    is_published,
    is_active,
    university_id,
  } = body as {
    name?: string
    description?: string
    subject_type?: string
    category?: string
    access_mode?: string
    price?: number
    is_published?: boolean
    is_active?: boolean
    university_id?: string
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('subjects')
    .update({
      name: name.trim(),
      description: description?.trim() ?? null,
      subject_type: subject_type ?? 'standard',
      category: category || null,
      access_mode: access_mode ?? 'free',
      price: price ?? 0,
      is_published: is_published ?? false,
      is_active: is_active ?? true,
      university_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subjectId)
    .select()
    .single()

  if (error) {
    console.error('update subject error:', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}