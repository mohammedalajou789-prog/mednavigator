import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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

  const { lecture_id, title, content, status } = body as {
    lecture_id?: string
    title?: string
    content?: string
    status?: string
  }

  if (!lecture_id) return NextResponse.json({ error: 'lecture_id is required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('sheets')
    .insert({
      lecture_id,
      title,
      content: content ?? null,
      status: status ?? 'draft',
      version: 1,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('create sheet error:', error)
    return NextResponse.json({ error: 'Failed to create sheet' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
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

  const { id, title, content, status } = body as {
    id?: string
    title?: string
    content?: string
    status?: string
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('sheets')
    .select('version')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('sheets')
    .update({
      title,
      content: content ?? null,
      status: status ?? 'draft',
      version: (existing?.version ?? 1) + 1,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('update sheet error:', error)
    return NextResponse.json({ error: 'Failed to update sheet' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}