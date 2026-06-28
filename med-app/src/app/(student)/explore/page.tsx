import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface University {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
}

export default async function ExplorePage() {
  const supabase = await createClient()

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name, logo_url, slug')
    .eq('is_active', true)
    .order('name')

  const { data: subjectCounts } = await supabase
    .from('subjects')
    .select('university_id')
    .eq('is_published', true)

  const countMap: Record<string, number> = {}
  ;(subjectCounts ?? []).forEach((row: { university_id: string }) => {
    countMap[row.university_id] = (countMap[row.university_id] ?? 0) + 1
  })

  const unis = (universities ?? []) as any[] as University[]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 28px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em' }}>
            Explore Universities
          </h1>
          <div style={{ color: 'var(--ink-2)', fontSize: 14.5 }}>
            Browse subjects and content from all universities on the platform.
          </div>
        </div>

        {/* Empty State */}
        {unis.length === 0 ? (
          <div style={{ border: '1px dashed var(--line)', borderRadius: 18, padding: '60px 30px', textAlign: 'center', color: 'var(--ink-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏛️</div>
            <div style={{ fontSize: 14 }}>No universities available yet.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {unis.map((uni) => {
              const subjectCount = countMap[uni.id] ?? 0
              return (
                <Link
                  key={uni.id}
                  href={`/${uni.slug ?? uni.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 18,
                    boxShadow: 'var(--shadow)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}>
                    {/* Top section */}
                    <div style={{ padding: '22px 22px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      {uni.logo_url ? (
                        <img
                          src={uni.logo_url}
                          alt={uni.name}
                          style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--line)' }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2F6BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                          {uni.name.charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {uni.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                          {subjectCount === 0 ? 'No subjects yet' : `${subjectCount} subject${subjectCount === 1 ? '' : 's'}`}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--primary)' }}>
                        BROWSE SUBJECTS
                      </span>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}

            
          </div>
        )}

      </main>
    </div>
  )
}