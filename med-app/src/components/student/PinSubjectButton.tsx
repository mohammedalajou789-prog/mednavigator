'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PinSubjectButtonProps {
  subjectId: string
  userId: string
  initialPinned: boolean
}

export default function PinSubjectButton({ subjectId, userId, initialPinned }: PinSubjectButtonProps) {
  const [pinned, setPinned] = useState(initialPinned)
  const [isPending, startTransition] = useTransition()

  const AMBER  = '#D97706'
  const INK3   = '#94A3B8'

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic update — تغيير فوري بدون انتظار
    const next = !pinned
    setPinned(next)

    startTransition(async () => {
      const supabase = createClient()

      if (next) {
        // Pin
        await supabase.from('pinned_subjects').upsert(
          { user_id: userId, subject_id: subjectId },
          { onConflict: 'user_id,subject_id' }
        )
      } else {
        // Unpin
        await supabase
          .from('pinned_subjects')
          .delete()
          .eq('user_id', userId)
          .eq('subject_id', subjectId)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={pinned ? 'Unpin subject' : 'Pin subject'}
      style={{
        background: 'none',
        border: 'none',
        cursor: isPending ? 'default' : 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        transition: 'opacity 0.15s',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={pinned ? AMBER : 'none'}
        stroke={pinned ? AMBER : INK3}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'fill 0.15s, stroke 0.15s' }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  )
}