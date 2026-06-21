'use client'

import { useState } from 'react'

interface StarRatingProps {
  lectureId: string
  initialStars?: number
  userId?: string
}

export default function StarRating({ lectureId, initialStars = 0, userId }: StarRatingProps) {
  const [stars, setStars] = useState(initialStars)
  const [hovered, setHovered] = useState(0)
  const [saving, setSaving] = useState(false)

  if (!userId) return null

  async function handleClick(value: number) {
    const newValue = stars === value ? 0 : value
    setSaving(true)
    try {
      await fetch('/api/student/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_id: lectureId, stars: newValue }),
      })
      setStars(newValue)
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  const display = hovered || stars

  const colors = [
    'text-red-400 hover:text-red-500',
    'text-amber-400 hover:text-amber-500',
    'text-green-400 hover:text-green-500',
  ]

  const labels = ['', 'Need Review', 'Almost There', 'Mastered']

  return (
    <div className="flex items-center gap-0.5" title={labels[stars]}>
      {[1, 2, 3].map(i => (
        <button
          key={i}
          onClick={e => { e.preventDefault(); e.stopPropagation(); handleClick(i) }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          disabled={saving}
          className={`w-5 h-5 transition-all duration-100 disabled:opacity-50 ${
            i <= display ? colors[i - 1] : 'text-slate-200 dark:text-slate-700'
          }`}
        >
          <svg viewBox="0 0 24 24" fill={i <= display ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  )
}