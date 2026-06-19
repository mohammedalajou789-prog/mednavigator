'use client'

import { useState, useTransition } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SearchProps {
  userId: string
  recentSearches: { id: string; search_query: string; created_at: string }[]
}

interface SearchResult {
  type: 'lecture' | 'subject'
  id: string
  title: string
  subtitle: string
  href: string
}

export default function SearchClient({ userId, recentSearches }: SearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const [searched, setSearched] = useState(false)
  const supabase = createBrowserClient()

  async function handleSearch(q: string) {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    setSearched(true)
    startTransition(async () => {
      const trimmed = q.trim()

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name, university_id, subject_type, universities(name)')
        .ilike('name', `%${trimmed}%`)
        .eq('is_published', true)
        .limit(5)

      const { data: lectures } = await supabase
        .from('lectures')
        .select('id, title, subject_id, subjects(name, university_id)')
        .ilike('title', `%${trimmed}%`)
        .eq('status', 'published')
        .limit(10)

      const subjectResults: SearchResult[] = (subjects ?? []).map(s => {
        const uni = s.universities as Record<string, unknown> | null
        return {
          type: 'subject' as const,
          id: s.id,
          title: s.name,
          subtitle: String(uni?.name ?? ''),
          href: `/${s.university_id}/${s.id}`,
        }
      })

      const lectureResults: SearchResult[] = (lectures ?? []).map(l => {
        const subj = l.subjects as Record<string, unknown> | null
        return {
          type: 'lecture' as const,
          id: l.id,
          title: l.title,
          subtitle: String(subj?.name ?? ''),
          href: `/${subj?.university_id}/${l.subject_id}/${l.id}`,
        }
      })

      setResults([...subjectResults, ...lectureResults])

      if (userId && trimmed.length > 2) {
        await supabase.from('search_history').insert({
          user_id: userId,
          search_query: trimmed,
          results_count: subjectResults.length + lectureResults.length,
        })
      }
    })
  }

  return (
    <div>
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          placeholder="Search lectures, subjects..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent shadow-sm text-base"
        />
        {isPending && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {searched && (
        <div className="mb-6">
          {results.length === 0 && !isPending ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium text-[#0F172A]">No results found</p>
              <p className="text-sm text-[#64748B] mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[#64748B] mb-3">{results.length} results</p>
              {results.map(result => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="flex items-center gap-3 bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#2563EB] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 bg-blue-50">
                    {result.type === 'subject' ? '📚' : '📖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">{result.title}</p>
                    <p className="text-xs text-[#64748B] truncate">{result.subtitle}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    result.type === 'subject' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {result.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && recentSearches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">Recent Searches</h2>
          <div className="space-y-2">
            {recentSearches.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setQuery(s.search_query)
                  handleSearch(s.search_query)
                }}
                className="flex items-center gap-3 w-full bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-sm hover:border-[#2563EB] transition-all group text-left"
              >
                <svg className="w-4 h-4 text-[#64748B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{s.search_query}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!searched && recentSearches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-medium text-[#0F172A]">Search for anything</p>
          <p className="text-sm text-[#64748B] mt-2">Lectures, subjects, chapters and more</p>
        </div>
      )}
    </div>
  )
}