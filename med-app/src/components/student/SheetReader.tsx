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

const SCROLL_THROTTLE_MS = 200
const MIN_PCT_DELTA = 1

export default function SheetReader({
  content,
  title = '',
  isSummary = false,
  userName,
  imageSlots = {},
  onProgressUpdate,
}: SheetReaderProps) {

  const lastEmittedPct = useRef<number>(-1)
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPct = useRef<number | null>(null)

  useEffect(() => {
    const scrollContainer = document.getElementById('lecture-content-scroll')
    if (!scrollContainer || !onProgressUpdate) return

    function computePct(el: HTMLElement): number | null {
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight <= 0) return null
      const rawPct = (scrollTop / scrollHeight) * 100
      return Math.min(100, Math.round(rawPct))
    }

    function flush() {
      throttleTimer.current = null
      if (pendingPct.current === null) return
      const pct = pendingPct.current
      pendingPct.current = null
      const changedEnough = Math.abs(pct - lastEmittedPct.current) >= MIN_PCT_DELTA
      if (!changedEnough && pct < 100) return
      lastEmittedPct.current = pct
      onProgressUpdate!(pct)
    }

    function handleScroll() {
      const el = document.getElementById('lecture-content-scroll')
      if (!el) return
      const pct = computePct(el)
      if (pct === null) return
      pendingPct.current = pct
      if (throttleTimer.current) return
      throttleTimer.current = setTimeout(flush, SCROLL_THROTTLE_MS)
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