'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SubjectsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('default_university_id')
        .eq('auth_user_id', authUser.id)
        .single()

      if (profile?.default_university_id) {
        router.push(`/${profile.default_university_id}`)
      } else {
        router.push('/home')
      }
    }
    redirect()
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-500">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading your subjects...</span>
      </div>
    </div>
  )
}