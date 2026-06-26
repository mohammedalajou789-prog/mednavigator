import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const authProfile = await requireAuth()

  const supabase = await createServerClient()

  const [{ data: profile }, { data: device }] = await Promise.all([
    supabase
      .from('users')
      .select('*, universities(id, name)')
      .eq('auth_user_id', authProfile.auth_user_id!)
      .single(),
    supabase
      .from('devices')
      .select('id, device_name, is_active, last_login_at, created_at')
      .eq('user_id', authProfile.id)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (!profile) redirect('/login')

  const university = profile.universities as { id: string; name: string } | null

  return (
    <ProfileClient
      profile={{
        id: profile.id,
        full_name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        role: profile.role ?? 'student',
        status: profile.status ?? 'active',
        created_at: profile.created_at ?? '',
      }}
      universityName={university?.name ?? '—'}
      device={device ? {
        id: device.id,
        device_name: device.device_name ?? null,
        is_active: device.is_active ?? false,
        last_login_at: device.last_login_at ?? null,
        created_at: device.created_at ?? '',
      } : null}
    />
  )
}