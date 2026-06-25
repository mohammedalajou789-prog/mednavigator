import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const getAuthUser = cache(async () => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getUserProfile = cache(async () => {
  const supabase = await createServerClient()
  const user = await getAuthUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, role, status, default_university_id, auth_user_id')
    .eq('auth_user_id', user.id)
    .single()

  return profile ?? null
})

export const requireAuth = cache(async () => {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  const profile = await getUserProfile()
  if (!profile) redirect('/login')
  return profile
})