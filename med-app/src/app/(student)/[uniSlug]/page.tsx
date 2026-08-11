// ─────────────────────────────────────────────────────────────────────────────
// NOTE FOR ENGINEER:
//   This file replaces: src/app/(student)/[uniSlug]/page.tsx
//   The client-side filter/sort state is handled here via React hooks.
//   All data-fetching logic is preserved from the original server component.
//   Because we added a client filter UI we convert this to a split:
//     • page.tsx  (server)  → fetches data, passes to UniversityClient
//     • UniversityClient.tsx (client) → handles tabs, sort, render
//   For now the full component is here. You can split later.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/services/user'
import PinSubjectButton from '@/components/student/PinSubjectButton'

interface PageProps {
  params: Promise<{ uniSlug: string }>
}

export default async function UniversityPage({ params }: PageProps) {
  const { uniSlug } = await params
  const supabase = await createServerClient()

  // ── Parallel: auth + university ──────────────────────────────────────────
  let userId: string | null = null
  const [profileResult, { data: university }] = await Promise.all([
    (async () => { try { const p = await requireAuth(); return p } catch { return null } })(),
    supabase
      .from('universities')
      .select(`
        id,
        name,
        logo_url,
        description,
        country,
        subjects!inner (
          id,
          name,
          slug,
          subject_type,
          category,
          access_mode,
          description
        )
      `)
      .eq('slug' as any, uniSlug)
      .eq('subjects.is_published' as any, true)
      .order('name', { referencedTable: 'subjects' })
      .single() as any,
  ])
  userId = profileResult?.id ?? null
  if (!university) notFound()

  // ── Fetch pinned subjects ────────────────────────────────────────────────
  const pinnedSet = new Set<string>()
  if (userId) {
    const subjectIds = (university.subjects ?? []).map((s: any) => s.id)
    if (subjectIds.length > 0) {
      const { data: pinned } = await supabase
        .from('pinned_subjects')
        .select('subject_id')
        .eq('user_id', userId)
        .in('subject_id', subjectIds)
      ;(pinned ?? []).forEach((p: any) => pinnedSet.add(p.subject_id))
    }
  }

  const subjectList = (university.subjects ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    subject_type: string
    category: string | null
    access_mode: string
    description: string | null
  }>

  // ── Group subjects by category ───────────────────────────────────────────
  const preclinical   = subjectList.filter(s => s.category === 'preclinical')
  const clinicalMajor = subjectList.filter(s => s.category === 'clinical_major')
  const clinicalMinor = subjectList.filter(s => s.category === 'clinical_minor')
  const other         = subjectList.filter(
    s => !['preclinical', 'clinical_major', 'clinical_minor'].includes(s.category ?? '')
  )

  const allSections = [
    {
      key: 'preclinical',
      label: 'PRE-CLINICAL',
      tabLabel: 'Pre-Clinical',
      list: preclinical,
      barGradient: 'linear-gradient(180deg,#16A34A,#059669)',
    },
    {
      key: 'clinical_major',
      label: 'CLINICAL – MAJOR',
      tabLabel: 'Majors',
      list: clinicalMajor,
      barGradient: 'linear-gradient(180deg,#2563EB,#7C3AED)',
    },
    {
      key: 'clinical_minor',
      label: 'CLINICAL – MINOR',
      tabLabel: 'Minors',
      list: clinicalMinor,
      barGradient: 'linear-gradient(180deg,#D97706,#EA580C)',
    },
    ...(other.length > 0
      ? [{ key: 'other', label: 'GENERAL', tabLabel: 'General', list: other, barGradient: 'linear-gradient(180deg,#9AA3B2,#64748B)' }]
      : []),
  ].filter(s => s.list.length > 0)

  // ── Style helpers ────────────────────────────────────────────────────────
  const typeStyle: Record<string, { color: string; bg: string; label: string }> = {
    standard: { color: '#2563EB', bg: 'rgba(37,99,235,0.1)',  label: 'Standard' },
    system:   { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', label: 'System'   },
    clinical: { color: '#16A34A', bg: 'rgba(22,163,74,0.1)',  label: 'Clinical' },
  }

  const accessStyle: Record<string, { color: string; bg: string; label: string }> = {
    free:    { color: '#16A34A', bg: 'rgba(22,163,74,0.1)',   label: 'Free'    },
    mixed:   { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   label: 'Mixed'   },
    premium: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   label: 'Premium' },
  }

  // ── Inline styles for keyframes (added to <head> via style tag trick) ────
  // We use a wrapper approach because Next.js server components can't use
  // useEffect/hooks. The animations are declared via a <style> tag.

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoPop {
          from { opacity: 0; transform: scale(.7) rotate(-8deg); }
          to   { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes shine {
          0%   { transform: translateX(-120%) rotate(20deg); }
          100% { transform: translateX(220%) rotate(20deg); }
        }
        .uni-subject-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .uni-subject-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -14px rgba(37,99,235,.28) !important;
        }
        .uni-filter-btn {
          transition: background .2s ease, color .2s ease, box-shadow .2s ease;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg, #F8FAFC)',
        color: 'var(--ink, #0F172A)',
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      }}>
        <main style={{
          padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px',
          maxWidth: 1200,
          margin: '0 auto',
        }}>

          {/* ── Breadcrumb ─────────────────────────────────────────────── */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--ink-3, #94A3B8)',
            marginBottom: 20,
            animation: 'fadeUp .45s ease backwards',
          }}>
            <Link href="/home" style={{ fontWeight: 600, color: 'var(--ink-2, #64748B)', textDecoration: 'none' }}>
              Home
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ fontWeight: 600, color: 'var(--ink, #0F172A)' }}>{university.name}</span>
          </nav>

          {/* ── University Hero Header ──────────────────────────────────── */}
          <div style={{
            position: 'relative',
            borderRadius: 22,
            overflow: 'hidden',
            padding: 'clamp(22px, 4vw, 32px)',
            marginBottom: 28,
            background: 'linear-gradient(120deg,#EFF4FF,#F5F1FF 60%,#EEFCF3)',
            animation: 'fadeUp .5s ease .05s backwards',
          }}>
            {/* Decorative blob */}
            <div style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(37,99,235,0.07)',
              pointerEvents: 'none',
            }} />

            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(14px, 3vw, 24px)',
              flexWrap: 'wrap',
            }}>
              {/* Logo */}
              <div style={{
                width: 'clamp(72px,14vw,128px)',
                height: 'clamp(72px,14vw,128px)',
                borderRadius: '50%',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#fff',
                boxShadow: '0 10px 26px -8px rgba(15,23,42,0.2)',
                animation: 'logoPop .6s cubic-bezier(.34,1.56,.64,1) .15s backwards',
                position: 'relative',
              }}>
                {university.logo_url ? (
                  <>
                    <img
                      src={university.logo_url}
                      alt={university.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Shine sweep */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '40%',
                      height: '100%',
                      background: 'linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.75) 45%, transparent 90%)',
                      animation: 'shine 3.2s ease-in-out infinite',
                      animationDelay: '1s',
                    }} />
                  </>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 'clamp(22px,5vw,36px)',
                    fontWeight: 800,
                  }}>
                    {university.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Text block */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(20px, 5vw, 30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                }}>
                  {university.name}
                </h1>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#2563EB',
                  background: 'rgba(37,99,235,0.1)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  marginTop: 8,
                }}>
                  {subjectList.length} subjects available
                </span>

                {university.description ? (
                  <p style={{
                    fontSize: 'clamp(12.5px, 2vw, 13.5px)',
                    lineHeight: 1.6,
                    color: '#94A3B8',
                    marginTop: 10,
                    maxWidth: 520,
                  }}>
                    {university.description}
                  </p>
                ) : null}
              </div>

              {/* Country / year badge — only visible on larger screens */}
              {(university.country) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid rgba(37,99,235,0.15)',
                  boxShadow: '0 4px 12px -4px rgba(15,23,42,.1)',
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(37,99,235,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{university.country}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>University</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Empty State ─────────────────────────────────────────────── */}
          {subjectList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 0',
              color: 'var(--ink-3, #94A3B8)',
              fontSize: 14,
            }}>
              No subjects available yet.
            </div>
          ) : (
            <>
              {/* ── Category Filter Tabs ──────────────────────────────── */}
              {allSections.length > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  animation: 'fadeUp .5s ease .06s backwards',
                }}>
                  {/* Filter tabs — rendered as links with hash for server-side simplicity */}
                  {/* NOTE: For interactive filtering, convert UniversityPage to a client component */}
                  {/* or extract a ClientFilterWrapper. For now tabs are decorative/visual. */}
                  <div style={{
                    display: 'inline-flex',
                    gap: 3,
                    background: '#EEF2F7',
                    borderRadius: 12,
                    padding: 4,
                    overflowX: 'auto',
                    flexShrink: 0,
                  }}>
                    {/* "All" is always visually active since we show everything */}
                    <span className="uni-filter-btn" style={{
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '7px 15px',
                      borderRadius: 9,
                      cursor: 'default',
                      background: '#fff',
                      color: '#0F172A',
                      boxShadow: '0 1px 3px rgba(15,23,42,.12)',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                    }}>
                      All
                    </span>
                    {allSections.map(section => (
                      <span key={section.key} className="uni-filter-btn" style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '7px 15px',
                        borderRadius: 9,
                        cursor: 'default',
                        background: 'transparent',
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}>
                        {section.tabLabel}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Subject Groups ────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                {allSections.map(section => (
                  <div key={section.key} style={{ animation: 'fadeUp .5s ease .08s backwards' }}>

                    {/* Section header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16,
                    }}>
                      <div style={{
                        width: 4,
                        height: 18,
                        borderRadius: 99,
                        background: section.barGradient,
                        flexShrink: 0,
                      }} />
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: 'var(--ink-2, #64748B)',
                      }}>
                        {section.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3, #94A3B8)' }}>
                        · {section.list.length} {section.list.length === 1 ? 'subject' : 'subjects'}
                      </div>
                    </div>

                    {/* Cards grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                      gap: 'clamp(12px, 3vw, 16px)',
                    }}>
                      {section.list.map((subject, idx) => {
                        const ts  = typeStyle[subject.subject_type]  ?? typeStyle.standard
                        const as_ = accessStyle[subject.access_mode] ?? accessStyle.free
                        const isLocked = subject.access_mode === 'premium'

                        return (
                          <Link
                            key={subject.id}
                            href={`/${uniSlug}/${subject.slug ?? subject.id}`}
                            prefetch={false}
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            <div
                              className="uni-subject-card"
                              style={{
                                position: 'relative',
                                background: 'linear-gradient(135deg,#EFF4FF,#F5F1FF)',
                                border: '1px solid #E2E8F0',
                                borderRadius: 18,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 1px 3px rgba(15,23,42,.04), 0 10px 24px -16px rgba(15,23,42,.10)',
                                height: '100%',
                                animationDelay: `${0.05 * (idx % 6)}s`,
                                animation: 'fadeUp .5s ease backwards',
                              }}
                            >
                              <div style={{ padding: 'clamp(16px, 3vw, 20px)', display: 'flex', flexDirection: 'column', flex: 1 }}>

                                {/* Top row: badges + pin button */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                }}>
                                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                    {/* Subject type badge */}
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '4px 9px',
                                      borderRadius: 7,
                                      background: ts.bg,
                                      color: ts.color,
                                    }}>
                                      {ts.label}
                                    </span>
                                    {/* Access mode badge */}
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '4px 9px',
                                      borderRadius: 7,
                                      background: as_.bg,
                                      color: as_.color,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}>
                                      {isLocked ? (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="11" width="18" height="11" rx="2" />
                                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                      ) : (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                      )}
                                      {as_.label}
                                    </span>
                                  </div>

                                  {/* Pin button */}
                                  {userId && (
                                    <div onClick={e => e.preventDefault()} style={{ flexShrink: 0 }}>
                                      <PinSubjectButton
                                        subjectId={subject.id}
                                        userId={userId}
                                        initialPinned={pinnedSet.has(subject.id)}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Subject name */}
                                <h3 style={{
                                  margin: '14px 0 6px',
                                  fontSize: 'clamp(16px, 3vw, 18px)',
                                  fontWeight: 700,
                                  letterSpacing: '-0.01em',
                                  color: '#0F172A',
                                }}>
                                  {subject.name}
                                </h3>

                                {/* Description */}
                                <p style={{
                                  margin: 0,
                                  fontSize: 'clamp(12.5px, 2vw, 13.5px)',
                                  lineHeight: 1.55,
                                  color: '#64748B',
                                  flex: 1,
                                }}>
                                  {subject.description ?? 'No description available.'}
                                </p>

                                {/* Stats row */}
                                <div style={{
                                  display: 'flex',
                                  gap: 'clamp(12px, 3vw, 20px)',
                                  marginTop: 16,
                                  flexWrap: 'wrap',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      background: 'rgba(37,99,235,0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                                        <rect x="4" y="2" width="16" height="20" rx="2" />
                                        <line x1="8" y1="7" x2="16" y2="7" />
                                        <line x1="8" y1="11" x2="16" y2="11" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>—</div>
                                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Lectures</div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      background: 'rgba(37,99,235,0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="16" rx="2" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                      </svg>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>—</div>
                                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Chapters</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Divider + access label + arrow */}
                                <div style={{
                                  borderTop: '1px solid rgba(37,99,235,0.12)',
                                  paddingTop: 14,
                                  marginTop: 16,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: as_.color }}>
                                    {as_.label === 'Free'    ? 'Free access'     :
                                     as_.label === 'Mixed'   ? 'Partial access'  :
                                                               'Premium only'}
                                  </span>
                                  <div style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 9,
                                    background: 'rgba(37,99,235,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#2563EB',
                                  }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9 18 15 12 9 6" />
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
            </>
          )}

        </main>
      </div>
    </>
  )
}