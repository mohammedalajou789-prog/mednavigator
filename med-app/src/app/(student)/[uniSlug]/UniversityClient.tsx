'use client'

import Link from 'next/link'
import { useState } from 'react'
import PinSubjectButton from '@/components/student/PinSubjectButton'

// ── Types ────────────────────────────────────────────────────────────────────
interface Subject {
  id: string
  name: string
  slug: string | null
  subject_type: string
  category: string | null
  access_mode: string
  description: string | null
}

interface Section {
  key: string
  label: string
  tabLabel: string
  list: Subject[]
  barGradient: string
}

interface Props {
  university: {
    id: string
    name: string
    logo_url: string | null
    description: string | null
    country: string | null
  }
  subjectList: Subject[]
  sections: Section[]
  pinnedIds: string[]
  userId: string | null
  uniSlug: string
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const typeStyle: Record<string, { color: string; bg: string; label: string }> = {
  standard: { color: '#2563EB', bg: 'rgba(37,99,235,0.10)',  label: 'Standard' },
  system:   { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', label: 'System'   },
  clinical: { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  label: 'Clinical' },
}

const accessStyle: Record<string, { color: string; bg: string; label: string }> = {
  free:    { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  label: 'Free'    },
  mixed:   { color: '#D97706', bg: 'rgba(217,119,6,0.10)',  label: 'Mixed'   },
  premium: { color: '#DC2626', bg: 'rgba(220,38,38,0.10)',  label: 'Premium' },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UniversityClient({
  university,
  subjectList,
  sections,
  pinnedIds,
  userId,
  uniSlug,
}: Props) {
  const pinnedSet = new Set(pinnedIds)

  // Active category filter — 'all' shows every section
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const visibleSections =
    activeCategory === 'all'
      ? sections
      : sections.filter(s => s.key === activeCategory)

  return (
    <>
      {/* ── Keyframe animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes mn-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mn-logoPop {
          from { opacity: 0; transform: scale(.7) rotate(-8deg); }
          to   { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes mn-shine {
          0%   { transform: translateX(-120%) rotate(20deg); }
          100% { transform: translateX(220%)  rotate(20deg); }
        }
        .mn-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .mn-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -14px rgba(37,99,235,.28) !important;
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

          {/* ── Breadcrumb ──────────────────────────────────────────────── */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--ink-3, #94A3B8)',
            marginBottom: 20,
            animation: 'mn-fadeUp .45s ease backwards',
          }}>
            <Link href="/home" style={{ fontWeight: 600, color: 'var(--ink-2, #64748B)', textDecoration: 'none' }}>
              Home
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ fontWeight: 600, color: 'var(--ink, #0F172A)' }}>{university.name}</span>
          </nav>

          {/* ── University Hero Header ───────────────────────────────────── */}
          <div style={{
            position: 'relative',
            borderRadius: 22,
            overflow: 'hidden',
            padding: 'clamp(22px, 4vw, 32px)',
            marginBottom: 28,
            background: 'linear-gradient(120deg,#EFF4FF,#F5F1FF 60%,#EEFCF3)',
            animation: 'mn-fadeUp .5s ease .05s backwards',
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
                width: 'clamp(72px,14vw,110px)',
                height: 'clamp(72px,14vw,110px)',
                borderRadius: '50%',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#fff',
                boxShadow: '0 10px 26px -8px rgba(15,23,42,0.2)',
                animation: 'mn-logoPop .6s cubic-bezier(.34,1.56,.64,1) .15s backwards',
                position: 'relative',
              }}>
                {university.logo_url ? (
                  <>
                    <img
                      src={university.logo_url}
                      alt={university.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '40%',
                      height: '100%',
                      background: 'linear-gradient(75deg,transparent 0%,rgba(255,255,255,0.75) 45%,transparent 90%)',
                      animation: 'mn-shine 3.2s ease-in-out infinite',
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

              {/* Text */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(20px,5vw,28px)',
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
                  {subjectList.length} {subjectList.length === 1 ? 'subject' : 'subjects'} available
                </span>

                {university.description && (
                  <p style={{
                    fontSize: 'clamp(12.5px,2vw,13.5px)',
                    lineHeight: 1.6,
                    color: '#94A3B8',
                    marginTop: 10,
                    maxWidth: 520,
                  }}>
                    {university.description}
                  </p>
                )}
              </div>

              {/* Country badge */}
              {university.country && (
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

          {/* ── Empty state ──────────────────────────────────────────────── */}
          {subjectList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8', fontSize: 14 }}>
              No subjects available yet.
            </div>
          ) : (
            <>
              {/* ── Category Filter Tabs ─────────────────────────────────── */}
              {sections.length > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  animation: 'mn-fadeUp .5s ease .06s backwards',
                }}>
                  <div style={{
                    display: 'inline-flex',
                    gap: 3,
                    background: '#EEF2F7',
                    borderRadius: 12,
                    padding: 4,
                    overflowX: 'auto',
                  }}>
                    {/* All tab */}
                    <button
                      onClick={() => setActiveCategory('all')}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '7px 15px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        border: 'none',
                        background: activeCategory === 'all' ? '#fff' : 'transparent',
                        color: activeCategory === 'all' ? '#0F172A' : '#64748B',
                        boxShadow: activeCategory === 'all' ? '0 1px 3px rgba(15,23,42,.12)' : 'none',
                        transition: 'background .2s ease, color .2s ease, box-shadow .2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      All
                    </button>

                    {sections.map(section => (
                      <button
                        key={section.key}
                        onClick={() => setActiveCategory(section.key)}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '7px 15px',
                          borderRadius: 9,
                          cursor: 'pointer',
                          border: 'none',
                          background: activeCategory === section.key ? '#fff' : 'transparent',
                          color: activeCategory === section.key ? '#0F172A' : '#64748B',
                          boxShadow: activeCategory === section.key ? '0 1px 3px rgba(15,23,42,.12)' : 'none',
                          transition: 'background .2s ease, color .2s ease, box-shadow .2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {section.tabLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Subject Groups ───────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                {visibleSections.map(section => (
                  <div key={section.key} style={{ animation: 'mn-fadeUp .5s ease .08s backwards' }}>

                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 4,
                        height: 18,
                        borderRadius: 99,
                        background: section.barGradient,
                        flexShrink: 0,
                      }} />
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B' }}>
                        {section.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>
                        · {section.list.length} {section.list.length === 1 ? 'subject' : 'subjects'}
                      </div>
                    </div>

                    {/* Cards grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                      gap: 'clamp(12px,3vw,16px)',
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
                              className="mn-card"
                              style={{
                                position: 'relative',
                                background: 'linear-gradient(135deg,#EFF4FF,#F5F1FF)',
                                border: '1px solid #E2E8F0',
                                borderRadius: 18,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)',
                                height: '100%',
                                animationDelay: `${0.05 * (idx % 6)}s`,
                                animation: 'mn-fadeUp .5s ease backwards',
                              }}
                            >
                              <div style={{
                                padding: 'clamp(16px,3vw,20px)',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                              }}>

                                {/* Badges + pin */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
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

                                  {userId && (
                                    <div onClick={e => e.preventDefault()}>
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
                                  fontSize: 'clamp(16px,3vw,18px)',
                                  fontWeight: 700,
                                  letterSpacing: '-0.01em',
                                  color: '#0F172A',
                                }}>
                                  {subject.name}
                                </h3>

                                {/* Description */}
                                <p style={{
                                  margin: 0,
                                  fontSize: 'clamp(12.5px,2vw,13.5px)',
                                  lineHeight: 1.55,
                                  color: '#64748B',
                                  flex: 1,
                                }}>
                                  {subject.description ?? 'No description available.'}
                                </p>

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
                                    {as_.label === 'Free'
                                      ? 'Free access'
                                      : as_.label === 'Mixed'
                                      ? 'Partial access'
                                      : 'Premium only'}
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