'use client'

import { useState } from 'react'

interface LectureStarsClientProps {
  lectureId: string
  initialStars: number
  userId: string
}

export default function LectureStarsClient({
  lectureId,
  initialStars,
  userId,
}: LectureStarsClientProps) {
  const [stars, setStars] = useState(initialStars)
  const [hovered, setHovered] = useState(0)
  const [saving, setSaving] = useState(false)

  async function handleClick(e: React.MouseEvent, value: number) {
    e.preventDefault()
    e.stopPropagation()
    const newValue = stars === value ? value - 1 : value
    setSaving(true)
    try {
      await fetch('/api/student/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_id: lectureId, stars: newValue }),
      })
      setStars(newValue)
      window.dispatchEvent(new CustomEvent('star-changed', { detail: { lectureId, stars: newValue } }))
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  const display = hovered || stars

  const starColors: Record<number, { filled: string; empty: string }> = {
    1: { filled: '#EF4444', empty: '#E2E8F0' },
    2: { filled: '#F59E0B', empty: '#E2E8F0' },
    3: { filled: '#22C55E', empty: '#E2E8F0' },
  }

  const labels: Record<number, string> = {
    0: 'Not reviewed',
    1: 'Need Review',
    2: 'Almost There',
    3: 'Mastered',
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 2 }}
      title={labels[stars]}
      onClick={e => e.preventDefault()}
    >
      {([1, 2, 3] as const).map(i => {
        const isFilled = i <= display
        const color = isFilled ? starColors[i].filled : starColors[i].empty
        return (
          <button
            key={i}
            onClick={e => handleClick(e, i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            disabled={saving}
            style={{
              width: 22,
              height: 22,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: saving ? 0.6 : 1,
              transition: 'transform 0.1s ease',
              transform: isFilled ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isFilled ? color : 'none'}
              stroke={color}
              strokeWidth={isFilled ? 1 : 1.5}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}