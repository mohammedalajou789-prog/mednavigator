'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import LectureStarsClient from '@/components/student/LectureStarsClient'

interface Lecture {
  id: string
  title: string
  display_order: number
  slug: string | null
}

interface ChapterProgressClientProps {
  uniSlug: string
  subjectSlug: string
  groupLabel: string
  groupTitle: string
  totalLectures: number
  totalFlash: number
  totalQuiz: number
  lectureList: Lecture[]
  initialStarsByLecture: Record<string, number>
  sheetMap: Record<string, boolean>
  flashMap: Record<string, number>
  quizMap: Record<string, number>
  userId: string | null
}

const RING_CIRC = 282.74

export default function ChapterProgressClient({
  uniSlug,
  subjectSlug,
  groupLabel,
  groupTitle,
  totalLectures,
  totalFlash,
  totalQuiz,
  lectureList,
  initialStarsByLecture,
  sheetMap,
  flashMap,
  quizMap,
  userId,
}: ChapterProgressClientProps) {
  const [starsByLecture, setStarsByLecture] = useState<Record<string, number>>(initialStarsByLecture)

  useEffect(() => {
    function handleStarChanged(e: Event) {
      const { lectureId, stars } = (e as CustomEvent).detail as { lectureId: string; stars: number }
      setStarsByLecture(prev => ({ ...prev, [lectureId]: stars }))
    }
    window.addEventListener('star-changed', handleStarChanged)
    return () => window.removeEventListener('star-changed', handleStarChanged)
  }, [])

  const isGuest = !userId

  const totalStars      = Object.values(starsByLecture).reduce((s, n) => s + n, 0)
  const progressPercent = totalLectures > 0 ? Math.round((totalStars / (totalLectures * 3)) * 100) : 0
  const ringOffset      = RING_CIRC * (1 - progressPercent / 100)
  const reviewedCount   = lectureList.filter(l => (starsByLecture[l.id] ?? 0) === 3).length

  return (
    <>
      {/* ── Responsive styles ── */}
      <style>{`
        .ch-hero { padding: 18px 16px; border-radius: 16px; margin-bottom: 20px; }
        .ch-hero-inner { flex-direction: column; gap: 16px; }
        .ch-hero-ring { display: none; }
        .ch-progress-bar { display: block; }
        .ch-title { font-size: 24px; }
        .ch-page { padding: 16px 16px 80px; }

        .lec-card { padding: 14px 14px; border-radius: 14px; margin-bottom: 10px; }
        .lec-inner { flex-wrap: wrap; gap: 10px; }
        .lec-status { display: none; }
        .lec-view { font-size: 13px; }

        @media (min-width: 640px) {
          .ch-hero { padding: 24px 24px; border-radius: 20px; }
          .ch-hero-inner { flex-direction: row; gap: 24px; align-items: center; }
          .ch-hero-ring { display: flex; justify-content: flex-start; }
          .ch-progress-bar { display: none; }
          .ch-title { font-size: 28px; }
          .ch-page { padding: 24px 24px 80px; }
          .lec-card { padding: 18px 20px; }
          .lec-status { display: inline-flex; }
        }

        @media (min-width: 900px) {
          .ch-hero { padding: 28px 32px; border-radius: 22px; margin-bottom: 30px; }
          .ch-title { font-size: 34px; }
          .ch-page { padding: 30px 34px 80px; }
          .lec-card { padding: 20px 24px; margin-bottom: 14px; border-radius: 18px; }
          .lec-inner { flex-wrap: nowrap; gap: 15px; }
        }
      `}</style>

      {/* Hero Banner */}
      <section className="ch-hero" style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(120deg, rgb(237, 243, 255) 0%, rgb(243, 247, 255) 52%, rgb(252, 253, 255) 100%)',
        border: '1px solid rgb(226, 234, 251)',
        boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px, rgba(40, 90, 200, 0.5) 0px 24px 50px -34px',
      }}>
        <div className="ch-hero-inner" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgb(47, 107, 255)', marginBottom: 6 }}>
              {groupLabel}
            </div>
            <h1 className="ch-title" style={{ margin: 0, lineHeight: 1.08, fontWeight: 800, letterSpacing: '-0.03em', color: 'rgb(21, 32, 58)' }}>
              {groupTitle}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 0', marginTop: 12, fontSize: 13, fontWeight: 600, color: 'rgb(136, 146, 168)' }}>
              <span style={{ marginRight: 8 }}>{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}</span>
              {!isGuest && <span style={{ marginRight: 8 }}>· {reviewedCount} of {totalLectures} reviewed</span>}
              {totalFlash > 0 && <span style={{ marginRight: 8 }}>· {totalFlash} flashcards</span>}
              {totalQuiz > 0  && <span style={{ marginRight: 8 }}>· {totalQuiz} questions</span>}
            </div>
          </div>

          {/* Progress Ring — tablet/desktop — only for logged in users */}
          {!isGuest && (
            <div className="ch-hero-ring" style={{ flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <svg width="90" height="90" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="54" cy="54" r="45" fill="none" stroke="#E1E9FA" strokeWidth="10" />
                  <circle cx="54" cy="54" r="45" fill="none" stroke="url(#chRing)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={RING_CIRC} strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                  <defs>
                    <linearGradient id="chRing" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#3B79FF" />
                      <stop offset="1" stopColor="#2456D6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'rgb(36, 86, 214)' }}>
                  {progressPercent}%
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar — mobile — only for logged in users */}
          {!isGuest && (
            <div className="ch-progress-bar" style={{ marginTop: 14, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(136, 146, 168)' }}>Progress</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'rgb(36, 86, 214)', letterSpacing: '-0.02em' }}>{progressPercent}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#E1E9FA', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 999, background: 'linear-gradient(90deg, #3B79FF, #2456D6)', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 5 }}>{reviewedCount} of {totalLectures} mastered</div>
            </div>
          )}
        </div>
      </section>

      {/* Guest progress banner */}
      {isGuest && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          background: 'linear-gradient(120deg, rgba(37,99,235,0.06), rgba(124,58,237,0.04))',
          border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>Track your progress</div>
              <div style={{ fontSize: 12, color: 'rgb(136, 146, 168)', marginTop: 1 }}>Create a free account to rate lectures and track your progress</div>
            </div>
          </div>
          <Link href="/register" prefetch={false} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 38, padding: '0 16px', borderRadius: 10,
            background: '#2563EB', color: '#fff',
            fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0,
          }}>
            Create Free Account
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      )}

      {/* Lectures Section */}
      <div>
        <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'rgb(21, 32, 58)' }}>
          Lectures
        </h2>

        {lectureList.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgb(136, 146, 168)', fontSize: 14 }}>
            No lectures in this {groupLabel.toLowerCase()} yet.
          </div>
        ) : lectureList.map((lecture) => {
          const lectureStars = starsByLecture[lecture.id] ?? 0
          const isMastered   = lectureStars === 3
          const lectureSlug  = lecture.slug ?? lecture.id

          const statusLabel = isMastered ? 'Mastered' : lectureStars === 2 ? 'Almost' : lectureStars === 1 ? 'Review' : 'Not started'
          const statusColor = isMastered ? 'rgb(19, 138, 90)' : lectureStars > 0 ? 'rgb(161, 115, 10)' : 'rgb(136, 146, 168)'
          const statusBg    = isMastered ? 'rgba(19,138,90,0.11)' : lectureStars > 0 ? 'rgba(216,154,6,0.11)' : 'rgb(241, 243, 249)'

          const iconBg    = isMastered ? 'rgb(231, 247, 239)' : 'rgb(238, 241, 248)'
          const iconColor = isMastered ? 'rgb(23, 166, 107)' : 'rgb(154, 164, 188)'

          const metaParts: string[] = []
          if (sheetMap[lecture.id])             metaParts.push('Sheet')
          if ((flashMap[lecture.id] ?? 0) > 0) metaParts.push(`${flashMap[lecture.id]} cards`)
          if ((quizMap[lecture.id]  ?? 0) > 0) metaParts.push(`${quizMap[lecture.id]} Q`)

          const starFills = [
            lectureStars >= 1 ? '#EF4444' : '#CBD5E1',
            lectureStars >= 2 ? '#F59E0B' : '#CBD5E1',
            lectureStars >= 3 ? '#22C55E' : '#CBD5E1',
          ]

          return (
            <div key={lecture.id} className="lec-card" style={{
              border: '1px solid rgb(231, 236, 246)',
              background: 'rgb(255, 255, 255)',
              boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px',
            }}>
              <div className="lec-inner" style={{ display: 'flex', alignItems: 'center' }}>

                {/* Icon */}
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 44, height: 44, borderRadius: 12,
                  background: iconBg, color: iconColor,
                  flexShrink: 0, fontSize: 18, fontWeight: 800,
                }}>
                  {isMastered ? '✓' : '•'}




                </span>

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)', lineHeight: 1.3 }}>
                    {lecture.title}
                  </div>
                  {metaParts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 0', fontSize: 12, fontWeight: 600, color: 'rgb(154, 164, 188)', marginTop: 3 }}>
                      {metaParts.map((part, i) => (
                        <span key={i} style={{ marginRight: 6 }}>{i > 0 ? '· ' : ''}{part}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stars — only for logged in users */}
                {!isGuest && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <LectureStarsClient
                      lectureId={lecture.id}
                      initialStars={lectureStars}
                      userId={userId!}
                    />
                  </span>
                )}

                {/* Status badge — only for logged in users, hidden on mobile */}
                {!isGuest && (
                  <span className="lec-status" style={{
                    padding: '4px 10px', borderRadius: 8,
                    fontSize: 11, fontWeight: 700,
                    background: statusBg, color: statusColor,
                    flexShrink: 0, alignItems: 'center',
                  }}>
                    {statusLabel}
                  </span>
                )}

                {/* View lecture */}
                <Link
                  className="lec-view"
                  href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`}
                  prefetch={false}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontWeight: 700, color: 'rgb(47, 107, 255)',
                    textDecoration: 'none', flexShrink: 0,
                  }}
                >
                  View
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}