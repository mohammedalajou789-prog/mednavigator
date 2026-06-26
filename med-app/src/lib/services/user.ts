import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUserFromHeader } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const getUserProfile = cache(async () => {
  const supabase = await createServerClient()
  const authUser = await getAuthUserFromHeader()
  if (!authUser) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, role, status, default_university_id, auth_user_id')
    .eq('auth_user_id', authUser.id)
    .single()

  return profile ?? null
})

export const requireAuth = cache(async () => {
  const authUser = await getAuthUserFromHeader()
  if (!authUser) redirect('/login')
  const profile = await getUserProfile()
  if (!profile) redirect('/login')
  return profile
})