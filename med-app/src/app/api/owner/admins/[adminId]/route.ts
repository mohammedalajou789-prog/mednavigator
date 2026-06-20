import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params
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

  const { full_name, phone, status, assigned_subject_ids } = body as {
    full_name?: string
    phone?: string
    status?: string
    assigned_subject_ids?: string[]
  }

  // Update admin basic info
  const { error: updateError } = await supabase
    .from('users')
    .update({
      full_name: full_name?.trim() ?? null,
      phone: phone?.trim() ?? null,
      status: status ?? 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', adminId)

  if (updateError) {
    console.error('update admin error:', updateError)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }

  // Handle subject assignments
  if (assigned_subject_ids !== undefined) {
    // Get current active assignments
    const { data: currentAssignments } = await supabase
      .from('admin_assignments')
      .select('id, subject_id')
      .eq('user_id', adminId)
      .eq('is_active', true)

    const currentIds = new Set((currentAssignments ?? []).map(a => a.subject_id))
    const newIds = new Set(assigned_subject_ids)

    // Remove assignments that are no longer selected
    const toRemove = (currentAssignments ?? []).filter(a => !newIds.has(a.subject_id))
    if (toRemove.length > 0) {
      await supabase
        .from('admin_assignments')
        .update({ is_active: false, removed_at: new Date().toISOString() })
        .in('id', toRemove.map(a => a.id))
    }

    // Add new assignments
    const toAdd = assigned_subject_ids.filter(id => !currentIds.has(id))
    if (toAdd.length > 0) {
      // Get university_id for each subject
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, university_id')
        .in('id', toAdd)

      if (subjects && subjects.length > 0) {
        await supabase
          .from('admin_assignments')
          .insert(
            subjects.map(s => ({
              user_id: adminId,
              subject_id: s.id,
              university_id: s.university_id,
              assigned_by: profile.id,
              is_active: true,
            }))
          )
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}