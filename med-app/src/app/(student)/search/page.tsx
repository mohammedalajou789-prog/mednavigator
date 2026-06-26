import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import SearchClient from '@/components/student/SearchClient'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const profile = await requireAuth()

  const supabase = await createServerClient()

  const [{ data: recentSearches }, params] = await Promise.all([
    supabase
      .from('search_history')
      .select('id, search_query, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    searchParams,
  ])

  const initialQuery = params.q ?? ''

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-white">Search</h1>
        <p className="text-[#64748B] mt-1">Find lectures, subjects, flashcards and more</p>
      </div>
      <SearchClient
        userId={profile.id}
        recentSearches={(recentSearches ?? []).map(s => ({
          ...s,
          created_at: s.created_at ?? '',
        }))}
        initialQuery={initialQuery}
      />
    </div>
  )
}