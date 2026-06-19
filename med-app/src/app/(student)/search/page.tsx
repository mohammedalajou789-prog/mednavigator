import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SearchClient from '@/components/student/SearchClient'

export default async function SearchPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, default_university_id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: recentSearches } = await supabase
    .from('search_history')
    .select('id, search_query, created_at')
    .eq('user_id', profile?.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Search</h1>
        <p className="text-[#64748B] mt-1">Find lectures, subjects, flashcards and more</p>
      </div>
      <SearchClient
        userId={profile?.id ?? ''}
        recentSearches={recentSearches ?? []}
      />
    </div>
  )
}