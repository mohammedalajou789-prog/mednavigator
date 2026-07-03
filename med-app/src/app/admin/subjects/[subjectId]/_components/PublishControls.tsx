'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  type: 'lecture' | 'chapter'
  id: string
  currentStatus: string
}

export default function PublishControls({ type, id, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isPublished = currentStatus === 'published'

  async function handleClick() {
    setLoading(true)
    try {
      await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id,
          action: isPublished ? 'unpublish' : 'publish',
        }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: '12px',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: '6px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        background: isPublished ? '#FEF3C7' : '#DCFCE7',
        color: isPublished ? '#92400E' : '#166534',
        transition: 'all 0.15s ease',
      }}
    >
      {loading ? '...' : isPublished ? 'Unpublish' : 'Publish'}
    </button>
  )
}