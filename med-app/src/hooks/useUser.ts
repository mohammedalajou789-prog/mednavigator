'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import type { UserProfile } from '@/types/app'

async function fetchCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, status, default_university_id, auth_user_id')
    .eq('auth_user_id', authUser.id)
    .single()
  if (error || !data) return null
  return data as UserProfile
}

export function useUser() {
  const { user, isLoading, setUser, setLoading } = useUserStore()
  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })
  useEffect(() => {
    if (query.isLoading) { setLoading(true); return }
    setLoading(false)
    setUser(query.data ?? null)
  }, [query.data, query.isLoading, setUser, setLoading])
  return {
    user,
    isLoading: isLoading || query.isLoading,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    role: user?.role ?? null,
  }
}