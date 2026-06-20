import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params
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

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, university_name } = body as {
    action?: string
    university_name?: string
  }

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (action === 'approve') {
    if (!university_name?.trim()) {
      return NextResponse.json({ error: 'university_name is required for approval' }, { status: 400 })
    }

    // Create the university
    const { data: newUniversity, error: createError } = await supabase
      .from('universities')
      .insert({
        name: university_name.trim(),
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      console.error('create university error:', createError)
      return NextResponse.json({ error: 'Failed to create university' }, { status: 500 })
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('university_requests')
      .update({
        status: 'approved',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('update request error:', updateError)
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    return NextResponse.json({ data: newUniversity }, { status: 200 })
  }

  // Reject
  const { error: rejectError } = await supabase
    .from('university_requests')
    .update({
      status: 'rejected',
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (rejectError) {
    console.error('reject request error:', rejectError)
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}