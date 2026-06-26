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

      const rawPct = (scrollTop / scrollHeight) * 100
      const pct = Math.min(100, Math.round(rawPct))

      // Update display immediately (no throttle on UI)
      onProgressUpdate!(pct)

      // Save to DB only if changed by 3% or more (throttled at 1.5s)
      if (Math.abs(pct - lastSavedPct.current) < 3) return
      if (throttleTimer.current) return

      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null
        lastSavedPct.current = pct
      }, 1500)
    }

    // Fire once on mount to restore saved progress position
    handleScroll()

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