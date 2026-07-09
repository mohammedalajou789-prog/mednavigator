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
        .ch-hero-ring { display: flex; justify-content: flex-start; }
        .ch-title { font-size: 24px; }
        .ch-page { padding: 16px 16px 80px; }

        .lec-card { padding: 14px 14px; border-radius: 14px; margin-bottom: 10px; }
        .lec-inner { flex-wrap: wrap; gap: 10px; }
        .lec-status { display: none; }
        .lec-view { font-size: 13px; }

        @media (min-width: 640px) {
          .ch-hero { padding: 24px 24px; border-radius: 20px; }
          .ch-hero-inner { flex-direction: row; gap: 24px; align-items: center; }
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, fontSize: 13, fontWeight: 600, color: 'rgb(136, 146, 168)' }}>
              <span>{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{reviewedCount} of {totalLectures} reviewed</span>
              {totalFlash > 0 && <><span>·</span><span>{totalFlash} flashcards</span></>}
              {totalQuiz > 0  && <><span>·</span><span>{totalQuiz} questions</span></>}
            </div>
          </div>

          {/* Progress Ring */}
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
        </div>
      </section>

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
          const iconMark  = isMastered ? '✓' : '•'

          const metaParts: string[] = []
          if (sheetMap[lecture.id])             metaParts.push('Sheet')
          if ((flashMap[lecture.id] ?? 0) > 0) metaParts.push(`${flashMap[lecture.id]} cards`)
          if ((quizMap[lecture.id]  ?? 0) > 0) metaParts.push(`${quizMap[lecture.id]} Q`)
          const metaText = metaParts.join(' · ')

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
                  width: 40, height: 40, borderRadius: 11,
                  background: iconBg, color: iconColor,
                  flexShrink: 0, fontSize: 16, fontWeight: 800,
                }}>
                  {iconMark}
                </span>

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)', lineHeight: 1.3 }}>
                    {lecture.title}
                  </div>
                  {metaText && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(154, 164, 188)', marginTop: 3 }}>
                      {metaText}
                    </div>
                  )}
                </div>

                {/* Stars */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  {userId ? (
                    <LectureStarsClient
                      lectureId={lecture.id}
                      initialStars={lectureStars}
                      userId={userId}
                    />
                  ) : (
                    starFills.map((fill, i) => (
                      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))
                  )}
                </span>

                {/* Status badge — hidden on mobile */}
                <span className="lec-status" style={{
                  padding: '4px 10px', borderRadius: 8,
                  fontSize: 11, fontWeight: 700,
                  background: statusBg, color: statusColor,
                  flexShrink: 0, alignItems: 'center',
                }}>
                  {statusLabel}
                </span>

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