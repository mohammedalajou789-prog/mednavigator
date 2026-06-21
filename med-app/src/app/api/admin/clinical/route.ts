import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function getProfile(supabase: Awaited<ReturnType<typeof createServerClient>>, authUserId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', authUserId)
    .single()
  return data
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getProfile(supabase, user.id)
    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    // Create clinical module
    if (action === 'create_module') {
      const { subject_id, module_type } = body

      // Check max 3 modules per subject
      const { data: existing } = await supabase
        .from('clinical_modules')
        .select('id')
        .eq('subject_id', subject_id)
        .is('archived_at', null)

      if (existing && existing.length >= 3) {
        return NextResponse.json({ error: 'Maximum 3 clinical modules allowed per subject.' }, { status: 400 })
      }

      // Check no duplicate module type
      const { data: duplicate } = await supabase
        .from('clinical_modules')
        .select('id')
        .eq('subject_id', subject_id)
        .eq('module_type', module_type)
        .is('archived_at', null)
        .single()

      if (duplicate) {
        return NextResponse.json({ error: 'This module type already exists for this subject.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('clinical_modules')
        .insert({ subject_id, module_type })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data })
    }

    // Create topic
    if (action === 'create_topic') {
      const { clinical_module_id, title, description } = body

      const { data, error } = await supabase
        .from('clinical_topics')
        .insert({ clinical_module_id, title: title.trim(), description: description?.trim() ?? null })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data })
    }

    // Create or update clinical sheet
    if (action === 'save_sheet') {
      const { clinical_topic_id, title, content, sheet_id } = body

      if (sheet_id) {
        const { data, error } = await supabase
          .from('clinical_sheets')
          .update({
            title: title.trim(),
            content,
            updated_by: profile.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sheet_id)
          .select()
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
      } else {
        const { data, error } = await supabase
          .from('clinical_sheets')
          .insert({
            clinical_topic_id,
            title: title.trim(),
            content,
            created_by: profile.id,
          })
          .select()
          .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
      }
    }

    // Delete topic
    if (action === 'delete_topic') {
      const { topic_id } = body
      const { error } = await supabase
        .from('clinical_topics')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', topic_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Delete module
    if (action === 'delete_module') {
      const { module_id } = body
      const { error } = await supabase
        .from('clinical_modules')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', module_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('Clinical API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}