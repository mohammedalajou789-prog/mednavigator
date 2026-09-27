'use client'

// ─────────────────────────────────────────────────────────────────────────────
// useReadingPosition — save & restore the reading position of a Sheet / Summary
//
// • Position is stored as a RATIO of the scrollable height in basis points
//   (0 = top, 10000 = bottom), so it lands on the same spot on any screen size.
//   Stored in user_progress.last_position (integer — always a whole number).
//   Values above 10000 are old pixel values and are ignored.
// • Priority when opening: 1) position from this browser session (most recent,
//   survives cached data) → 2) database (other devices) → 3) localStorage
//   (guests, offline, or no database row yet).
// • Saves 1 second after scrolling stops, and immediately when leaving the page,
//   hiding the tab, or switching apps on a phone. Save errors are logged.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const SCROLL_ID     = 'lecture-content-scroll'
const MAX_BP        = 10000
const SAVE_DELAY_MS = 1000
const SETTLE_MS     = 400   // content must stop growing for this long before restoring
const MAX_WAIT_MS   = 4000  // restore anyway after this long

type ReadingContentType = 'sheet' | 'summary'

interface Options {
  lectureId: string
  contentType: ReadingContentType
  userId: string | null
  ready: boolean              // true once the content is rendered
  dbPosition: number | null   // user_progress.last_position (basis points)
  initialPercent: number      // user_progress.progress_percentage
}

// Latest position per lecture/content in this browser session (cached queries can hold stale DB values)
const sessionPositions = new Map<string, { bp: number; pct: number }>()

function localKey(lectureId: string, type: ReadingContentType) {
  return `lecture:${lectureId}:${type}_pos_bp`
}

function readBp(el: HTMLElement): number {
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return Math.min(MAX_BP, Math.max(0, Math.round((el.scrollTop / max) * MAX_BP)))
}

function emitSidebar(type: string, data: unknown) {
  window.dispatchEvent(new CustomEvent('lecture-sidebar-update', { detail: { type, data } }))
}

export function useReadingPosition({ lectureId, contentType, userId, ready, dbPosition, initialPercent }: Options) {
  const supabase = useMemo(() => createClient(), [])

  const restoredRef  = useRef(false)
  const posRef       = useRef(0)    // latest position (basis points)
  const pctRef       = useRef(0)    // latest percentage
  const lastSavedRef = useRef(-1)   // last position written to the database
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Save to database (skipped if nothing changed) ──────────────────────────
  const saveToDb = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (!userId || !restoredRef.current) return
    const bp = posRef.current
    if (bp === lastSavedRef.current) return
    lastSavedRef.current = bp
    const pct = pctRef.current
    const now = new Date().toISOString()
    supabase.from('user_progress').upsert({
      user_id:             userId,
      lecture_id:          lectureId,
      content_type:        contentType,
      progress_percentage: pct,
      completed:           pct >= 100,
      last_position:       bp,
      last_accessed_at:    now,
      updated_at:          now,
    }, { onConflict: 'user_id,lecture_id,content_type' })
      .then(({ error }) => {
        if (error) {
          lastSavedRef.current = -1 // allow retry on next scroll
          console.error(`[reading-position] ${contentType} save failed:`, error.message)
        }
      })
  }, [supabase, userId, lectureId, contentType])

  // ── Restore once the content is rendered and has stopped growing ───────────
  useEffect(() => {
    if (!ready || restoredRef.current) return
    const el = document.getElementById(SCROLL_ID)
    if (!el) return

    let local: number | null = null
    try {
      const raw = localStorage.getItem(localKey(lectureId, contentType))
      const n = raw === null ? NaN : parseInt(raw, 10)
      if (!isNaN(n) && n >= 0 && n <= MAX_BP) local = n
    } catch { /* storage blocked */ }

    const session = sessionPositions.get(localKey(lectureId, contentType))
    const db = dbPosition !== null && dbPosition > 0 && dbPosition <= MAX_BP ? dbPosition : null
    const target = session ? session.bp : userId && db !== null ? db : (local ?? 0)

    posRef.current       = target
    pctRef.current       = session ? session.pct : initialPercent
    lastSavedRef.current = session ? -1 : (db ?? -1)

    let done = false
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    let maxTimer: ReturnType<typeof setTimeout> | null = null
    let observer: ResizeObserver | null = null

    const apply = () => {
      if (done) return
      done = true
      observer?.disconnect()
      if (settleTimer) clearTimeout(settleTimer)
      if (maxTimer) clearTimeout(maxTimer)
      const max = el.scrollHeight - el.clientHeight
      el.scrollTo({ top: target > 0 && max > 0 ? Math.round((target / MAX_BP) * max) : 0 })
      restoredRef.current = true
      emitSidebar('progress', { percent: pctRef.current, completed: pctRef.current >= 100 })
    }

    if (target <= 0) { apply(); return }

    const resetSettle = () => {
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(apply, SETTLE_MS)
    }
    observer = new ResizeObserver(resetSettle)
    Array.from(el.children).forEach(child => observer!.observe(child))
    resetSettle()
    maxTimer = setTimeout(apply, MAX_WAIT_MS)

    return () => {
      done = true
      observer?.disconnect()
      if (settleTimer) clearTimeout(settleTimer)
      if (maxTimer) clearTimeout(maxTimer)
    }
  }, [ready, lectureId, contentType, userId, dbPosition, initialPercent])

  // ── Flush when leaving: route change, tab hidden, page closed ──────────────
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') saveToDb() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', saveToDb)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', saveToDb)
      saveToDb()
    }
  }, [saveToDb])

  // ── Called by SheetReader on scroll ────────────────────────────────────────
  return useCallback((pct: number) => {
    if (!restoredRef.current) return // ignore scroll events caused before/while restoring
    const el = document.getElementById(SCROLL_ID)
    if (!el) return
    const bp = readBp(el)
    posRef.current = bp
    pctRef.current = pct
    emitSidebar('progress', { percent: pct, completed: pct >= 100 })
    sessionPositions.set(localKey(lectureId, contentType), { bp, pct })
    try { localStorage.setItem(localKey(lectureId, contentType), String(bp)) } catch { /* storage blocked */ }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(saveToDb, SAVE_DELAY_MS)
  }, [lectureId, contentType, saveToDb])
}
