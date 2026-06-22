import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(id, name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: device } = await supabase
    .from('devices')
    .select('id, device_name, is_active, last_login_at, created_at')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .maybeSingle()

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
      device={device ?? null}
    />
  )
}