'use client'

import { useState, useEffect } from 'react'

interface ChapterProgressHeaderProps {
  totalLectures: number
  initialStars: number
  initialStarsByLecture: Record<string, number>
  groupLabel: string
  groupTitle: string
}

export default function ChapterProgressHeader({
  totalLectures,
  initialStars,
  initialStarsByLecture,
  groupLabel,
  groupTitle,
}: ChapterProgressHeaderProps) {
  const [totalStars, setTotalStars] = useState(initialStars)

  useEffect(() => {
    function handleStarChange(e: Event) {
      const { lectureId, stars } = (e as CustomEvent).detail
      setTotalStars(prev => {
        const old = initialStarsByLecture[lectureId] ?? 0
        return prev - old + stars
      })
    }
    window.addEventListener('star-changed', handleStarChange)
    return () => window.removeEventListener('star-changed', handleStarChange)
  }, [initialStarsByLecture])

  const progressPercent = totalLectures > 0
    ? Math.round((totalStars / (totalLectures * 3)) * 100)
    : 0

  return (
    <div style={{ borderRadius: 20, padding: 'clamp(18px,4vw,28px) clamp(18px,4vw,30px)', marginBottom: 28, background: 'linear-gradient(120deg,rgb(232,240,255) 0%,rgb(245,248,255) 100%)', border: '1px solid rgb(223,232,251)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(47,107,255,0.7)', marginBottom: 8 }}>
          {groupLabel.toUpperCase()}
        </div>
        <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(22px,5vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#15203A' }}>
          {groupTitle}
        </h1>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, color: 'rgba(27,35,53,0.6)', fontWeight: 600 }}>
            {totalLectures} lecture{totalLectures !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 13.5, color: 'rgba(27,35,53,0.6)', fontWeight: 600 }}>
            {Math.round(totalStars / 3 * 10) / 10} of {totalLectures} reviewed
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(47,107,255,0.15)" strokeWidth="7"/>
          <circle
            cx="40" cy="40" r="33"
            fill="none" stroke="#2F6BFF" strokeWidth="7" strokeLinecap="round"
            strokeDasharray="207.3"
            strokeDashoffset={207.3 * (1 - progressPercent / 100)}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#2F6BFF', letterSpacing: '-0.03em' }}>
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  )
}