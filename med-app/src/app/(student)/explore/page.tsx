import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface University {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
}

interface SubjectCount {
  university_id: string
  count: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function ExplorePage() {
  const supabase = await createClient()

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name, logo_url, slug')
    .eq('is_active', true)
    .order('name')

  // Count published subjects per university
  const { data: subjectCounts } = await supabase
    .from('subjects')
    .select('university_id')
    .eq('is_published', true)

  const countMap: Record<string, number> = {}
  ;(subjectCounts ?? []).forEach((row: { university_id: string }) => {
    countMap[row.university_id] = (countMap[row.university_id] ?? 0) + 1
  })

  const unis = (universities ?? []) as University[]

  return (
    <div className="p-6 space-y-6 max-w-7xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Explore Universities
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Browse subjects and content from all universities on the platform.
        </p>
      </div>

      {/* Grid */}
      {unis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
          <p className="text-3xl mb-3">🏛️</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No universities available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unis.map((uni) => {
            const subjectCount = countMap[uni.id] ?? 0
            return (
              <Link
                key={uni.id}
                href={`/${uni.slug ?? uni.id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
              >
                {/* Logo or initials */}
                <div className="flex items-center gap-4 mb-4">
                  {uni.logo_url ? (
                    <img
                      src={uni.logo_url}
                      alt={uni.name}
                      className="h-12 w-12 rounded-xl object-contain bg-slate-100 dark:bg-slate-700 p-1 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(uni.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug truncate">
                      {uni.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {subjectCount === 0
                        ? 'No subjects yet'
                        : `${subjectCount} subject${subjectCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Browse subjects
                  </span>
                  <span className="text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform text-sm">
                    →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}