import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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
    platform_name,
    support_email,
    whatsapp_url,
    telegram_url,
    terms_of_service,
    privacy_policy,
  } = body as {
    platform_name?: string
    support_email?: string
    whatsapp_url?: string
    telegram_url?: string
    terms_of_service?: string
    privacy_policy?: string
  }

  // Check if settings row exists
  const { data: existing } = await supabase
    .from('platform_settings')
    .select('id')
    .single()

  if (existing) {
    const { error } = await supabase
      .from('platform_settings')
      .update({
        ...(platform_name !== undefined && { platform_name }),
        ...(support_email !== undefined && { support_email }),
        ...(whatsapp_url !== undefined && { whatsapp_url }),
        ...(telegram_url !== undefined && { telegram_url }),
        ...(terms_of_service !== undefined && { terms_of_service }),
        ...(privacy_policy !== undefined && { privacy_policy }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      console.error('update settings error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('platform_settings')
      .insert({
        platform_name: platform_name ?? 'MedNavigator',
        support_email: support_email ?? null,
        whatsapp_url: whatsapp_url ?? null,
        telegram_url: telegram_url ?? null,
        terms_of_service: terms_of_service ?? null,
        privacy_policy: privacy_policy ?? null,
        owner_user_id: profile.id,
      })

    if (error) {
      console.error('insert settings error:', error)
      return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}