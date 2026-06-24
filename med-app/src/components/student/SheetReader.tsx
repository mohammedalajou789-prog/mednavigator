'use client'

import { useEffect } from 'react'
import MNRenderer from './MNRenderer'

interface SheetReaderProps {
  content: string
  title?: string
  isSummary?: boolean
  userName?: string
  imageSlots?: Record<number, string>
  onProgressUpdate?: (pct: number) => void
  tocSections?: { id: string; level: number; label: string }[]
}

export default function SheetReader({
  content,
  title = '',
  isSummary = false,
  userName,
  imageSlots = {},
  onProgressUpdate,
}: SheetReaderProps) {

  useEffect(() => {
    const scrollContainer = document.getElementById('lecture-content-scroll')
    if (!scrollContainer || !onProgressUpdate) return

    function handleScroll() {
      const el = document.getElementById('lecture-content-scroll')
      if (!el) return
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) {
        const pct = Math.round((scrollTop / scrollHeight) * 100)
        onProgressUpdate!(pct)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [onProgressUpdate])

  return (
    <div style={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
      <MNRenderer
        content={content}
        showWatermark={true}
        userName={userName}
        imageSlots={imageSlots}
      />
    </div>
  )
}