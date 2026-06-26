'use client'

import { useEffect, useRef } from 'react'
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

  const lastSavedPct = useRef<number>(-1)
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const scrollContainer = document.getElementById('lecture-content-scroll')
    if (!scrollContainer || !onProgressUpdate) return

    function handleScroll() {
      const el = document.getElementById('lecture-content-scroll')
      if (!el) return

      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight <= 0) return

      const pct = Math.round((scrollTop / scrollHeight) * 100)

      // Only save if percentage changed by at least 5%
      if (Math.abs(pct - lastSavedPct.current) < 5) return

      // Throttle: only fire once every 2 seconds
      if (throttleTimer.current) return

      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null
        lastSavedPct.current = pct
        onProgressUpdate!(pct)
      }, 2000)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (throttleTimer.current) clearTimeout(throttleTimer.current)
    }
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