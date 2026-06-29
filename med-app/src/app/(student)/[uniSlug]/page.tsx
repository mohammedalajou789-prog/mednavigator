import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ uniSlug: string }>
}

export default async function UniversityPage({ params }: PageProps) {
  const { uniSlug } = await params

  const supabase = await createServerClient()

  const { data: university } = await supabase
    .from('universities')
    .select('id, name, logo_url')
    .eq('slug' as any, uniSlug)
    .single()

  if (!university) notFound()

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, slug, subject_type, category, access_mode, description')
    .eq('university_id', university.id)
    .eq('is_published', true)
    .order('name') as any

  const subjectList = (subjects ?? []) as Array<{
    id: string
    name: string
    subject_type: string
    category: string | null
    access_mode: string
    description: string | null
  }>

  const preclinical   = subjectList.filter(s => s.category === 'preclinical')
  const clinicalMajor = subjectList.filter(s => s.category === 'clinical_major')
  const clinicalMinor = subjectList.filter(s => s.category === 'clinical_minor')
  const other         = subjectList.filter(s => !['preclinical','clinical_major','clinical_minor'].includes(s.category ?? ''))

  const sections = [
    { key: 'preclinical',    label: 'Pre-Clinical',     list: preclinical,   barColor: '#2F6BFF' },
    { key: 'clinical_major', label: 'Clinical - Major', list: clinicalMajor, barColor: '#6E6BD8' },
    { key: 'clinical_minor', label: 'Clinical - Minor', list: clinicalMinor, barColor: '#138A5A' },
    { key: 'other',          label: 'General',          list: other,         barColor: '#9AA3B2' },
  ].filter(s => s.list.length > 0)

  const typeStyle: Record<string, { color: string; bg: string }> = {
    standard: { color: '#2F6BFF', bg: 'rgba(47,107,255,0.11)'  },
    system:   { color: '#6E6BD8', bg: 'rgba(110,107,216,0.11)' },
    clinical: { color: '#138A5A', bg: 'rgba(19,138,90,0.11)'   },
  }

  const accessStyle: Record<string, { color: string; bg: string }> = {
    free:    { color: '#138A5A', bg: 'rgba(19,138,90,0.11)'  },
    mixed:   { color: '#D89A06', bg: 'rgba(216,154,6,0.11)'  },
    premium: { color: '#DC4842', bg: 'rgba(220,72,66,0.11)'  },
  }

  const gradients: Record<string, string> = {
    preclinical:    'linear-gradient(90deg,#2F6BFF,#6E6BD8)',
    clinical_major: 'linear-gradient(90deg,#6E6BD8,#2F6BFF)',
    clinical_minor: 'linear-gradient(90deg,#138A5A,#2F6BFF)',
    other:          'linear-gradient(90deg,#9AA3B2,#6E6BD8)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px' }}>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
          <Link href="/home" style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>
            Home
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{university.name}</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', border: '1px solid var(--line)', overflow: 'hidden', flexShrink: 0, background: 'var(--card)' }}>
            {university.logo_url ? (
              <img src={university.logo_url} alt={university.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2F6BFF', color: '#fff', fontSize: 22, fontWeight: 800 }}>
                {university.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em' }}>{university.name}</h1>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 2 }}>
              {subjectList.length} {subjectList.length === 1 ? 'subject' : 'subjects'} available
            </div>
          </div>
        </div>

        {subjectList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-3)', fontSize: 14 }}>
            No subjects available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {sections.map(section => (
              <div key={section.key}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 18, borderRadius: 99, background: section.barColor }} />
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-2)' }}>
                    {section.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    · {section.list.length} {section.list.length === 1 ? 'subject' : 'subjects'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(12px, 3vw, 18px)' }}>
                  {section.list.map(subject => {
                    const ts  = typeStyle[subject.subject_type]  ?? typeStyle.standard
                    const as_ = accessStyle[subject.access_mode] ?? accessStyle.free
                    const isLocked   = subject.access_mode === 'premium'
                    const typeLabel  = subject.subject_type === 'system' ? 'System' : subject.subject_type === 'clinical' ? 'Clinical' : 'Standard'
                    const accessLabel = subject.access_mode === 'premium' ? 'Premium' : subject.access_mode === 'mixed' ? 'Mixed' : 'Free'
                    const grad = gradients[section.key]

                    return (
                      <Link key={subject.id} href={`/${uniSlug}/${(subject as any).slug ?? subject.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', overflow: 'hidden', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>

                          <div style={{ height: 6, background: grad }} />

                          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>

                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: ts.bg, color: ts.color }}>
                                  {typeLabel}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: as_.bg, color: as_.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {isLocked && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                  )}
                                  {accessLabel}
                                </span>
                              </div>
                              <div style={{ color: 'var(--ink-3)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6L5.7 21 8 13.9 2 9.4h7.6z"/>
                                </svg>
                              </div>
                            </div>

                            <h3 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
                              {subject.name}
                            </h3>

                            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)', flex: 1 }}>
                              {subject.description ?? 'No description available.'}
                            </p>

                            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13.5, fontWeight: 700, color: as_.color }}>
                                {accessLabel === 'Free' ? 'Free access' : accessLabel === 'Mixed' ? 'Partial access' : 'Premium only'}
                              </span>
                              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </div>
                            </div>

                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}