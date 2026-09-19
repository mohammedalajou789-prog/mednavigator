'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useQuery } from '@tanstack/react-query'
import SheetReader from '@/components/student/SheetReader'
import LockedContentCard from '@/components/student/LockedContentCard'
import { useLectureData } from '@/components/student/LectureDataProvider'
import LectureMobileTabs from '@/components/student/LectureMobileTabs'

interface TocSection {
  id: string; level: number; label: string; h1Num: number; h2Num: number | null
}

function extractToc(content: string): TocSection[] {
  const lines = content.split('\n')
  const toc: TocSection[] = []
  let h1Counter = 0; let h2Counter = 0
  const headingIdCounts: Record<string, number> = {}
  function makeHeadingId(rawText: string): string {
    const base = `section-${rawText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
    headingIdCounts[base] = (headingIdCounts[base] ?? 0) + 1
    const n = headingIdCounts[base]
    return n === 1 ? base : `${base}-${n}`
  }
  lines.forEach((line) => {
    const h1 = line.match(/^#\s+(.+)/); const h2 = line.match(/^##\s+(.+)/); const h3 = line.match(/^###\s+(.+)/)
    if (h1) {
      h1Counter++; h2Counter = 0
      const label = h1[1].trim()
      toc.push({ id: makeHeadingId(label), level: 1, label, h1Num: h1Counter, h2Num: null })
    } else if (h2) {
      h2Counter++
      const label = h2[1].trim()
      const id = makeHeadingId(label)
      if (h1Counter === 0) { h1Counter++; h2Counter = 0; toc.push({ id, level: 1, label, h1Num: h1Counter, h2Num: null }) }
      else { toc.push({ id, level: 2, label, h1Num: h1Counter, h2Num: h2Counter }) }
    } else if (h3) {
      const label = h3[1].trim()
      toc.push({ id: makeHeadingId(label), level: 3, label, h1Num: h1Counter, h2Num: h2Counter })
    }
  })
  return toc
}

function emitSidebar(type: string, data: unknown) {
  window.dispatchEvent(new CustomEvent('lecture-sidebar-update', { detail: { type, data } }))
}

function getScrollKey(lectureId: string) {
  return `lecture:${lectureId}:sheet_scroll`
}

export default function SheetPage() {
  const params      = useParams()
  const uniSlug     = params.uniSlug     as string
  const subjectSlug = params.subjectSlug as string

  const { lecture, subject, userId, accessAllowed } = useLectureData()
  const { user } = useUserStore()
  const supabase = useMemo(() => createClient(), [])

  const lastSavedPct  = useRef<number>(-1)
  const saveTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollApplied = useRef(false)
  const scrollTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: sheetData, isLoading: sheetLoading } = useQuery({
    queryKey: ['sheet-full', lecture.id, userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sheet_bundle' as any, {
        p_lecture_id: lecture.id,
        p_user_id: userId,
      })
      if (error) throw error

      const bundle = data as unknown as {
        sheet: { id: string; content: string; status: string } | null
        image_slots: { slot_number: number; file_url: string }[]
        progress: { progress_percentage: number; completed: boolean; last_position: number } | null
      }

      const imageSlots: Record<number, string> = {}
      for (const slot of bundle.image_slots) {
        imageSlots[slot.slot_number] = slot.file_url
      }

      return {
        sheet: bundle.sheet,
        imageSlots,
        savedPct:      bundle.progress?.progress_percentage ?? 0,
        savedPosition: bundle.progress?.last_position       ?? 0,
        completed:     bundle.progress?.completed            ?? false,
      }
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!sheetData) return
    emitSidebar('progress', { percent: sheetData.savedPct, completed: sheetData.completed })
    if (sheetData.sheet?.content) {
      emitSidebar('toc', { sections: extractToc(sheetData.sheet.content) })
      emitSidebar('sheetContent', { content: sheetData.sheet.content })
    }
  }, [sheetData])

  useEffect(() => {
    if (scrollApplied.current) return
    if (!sheetData) return

    const localVal = localStorage.getItem(getScrollKey(lecture.id))
    const targetScroll = localVal ? parseInt(localVal, 10) : (sheetData.savedPosition ?? 0)

    if (targetScroll <= 0) { scrollApplied.current = true; return }
    scrollApplied.current = true

    let cancelled = false
    let observer: ResizeObserver | null = null
    let safetyTimer: ReturnType<typeof setTimeout> | null = null

    function settle(el: HTMLElement) {
      if (cancelled) return
      cancelled = true
      observer?.disconnect()
      if (safetyTimer) clearTimeout(safetyTimer)
      el.scrollTo({ top: targetScroll, behavior: 'smooth' })
    }

    function watch(el: HTMLElement) {
      const trySettle = () => {
        const maxScroll = el.scrollHeight - el.clientHeight
        if (maxScroll >= targetScroll * 0.9) settle(el)
      }

      const growthTarget = (el.firstElementChild as HTMLElement) ?? el
      observer = new ResizeObserver(trySettle)
      observer.observe(growthTarget)
      if (growthTarget !== el) observer.observe(el)

      safetyTimer = setTimeout(() => settle(el), 3000)
      trySettle()
    }

    function waitForElement(frames = 0) {
      if (cancelled) return
      const el = document.getElementById('lecture-content-scroll')
      if (el) { watch(el); return }
      if (frames < 30) requestAnimationFrame(() => waitForElement(frames + 1))
    }

    waitForElement()

    return () => {
      cancelled = true
      observer?.disconnect()
      if (safetyTimer) clearTimeout(safetyTimer)
    }
  }, [sheetData, lecture.id])

  const handleProgressUpdate = useCallback((pct: number) => {
    emitSidebar('progress', { percent: pct, completed: pct >= 100 })

    const scrollEl  = document.getElementById('lecture-content-scroll')
    const scrollPos = scrollEl?.scrollTop ?? 0
    localStorage.setItem(getScrollKey(lecture.id), String(scrollPos))

    if (!user || !userId) return
    if (Math.abs(pct - lastSavedPct.current) < 2) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      lastSavedPct.current = pct
      const el  = document.getElementById('lecture-content-scroll')
      const pos = el?.scrollTop ?? 0
      supabase.from('user_progress').upsert({
        user_id:             userId,
        lecture_id:          lecture.id,
        content_type:        'sheet',
        progress_percentage: pct,
        completed:           pct >= 100,
        last_position:       pos,
        last_accessed_at:    new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })
    }, 2000)
  }, [user, userId, lecture.id, supabase])

  // Save on client-side navigation away from this page
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const el  = document.getElementById('lecture-content-scroll')
      const pos = el?.scrollTop ?? 0
      localStorage.setItem(getScrollKey(lecture.id), String(pos))
    }
  }, [lecture.id])

  // Save on hard refresh / tab close (this was missing before)
  useEffect(() => {
    function handleUnload() {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const el  = document.getElementById('lecture-content-scroll')
      const pos = el?.scrollTop ?? 0
      localStorage.setItem(getScrollKey(lecture.id), String(pos))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [lecture.id])

  const sheet       = sheetData?.sheet
  const imageSlots  = sheetData?.imageSlots ?? {}
  const locked      = !accessAllowed
  const displayName = user?.full_name ?? ''

  const ContentSkeleton = () => (
    <div style={{ padding: '24px 0' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: i === 0 ? '28px' : '16px', background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', borderRadius: '8px', marginBottom: '16px', width: i % 3 === 2 ? '60%' : '100%', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  )

  return (
    <>
      <LectureMobileTabs activeTab="sheet" />

      <div style={{ padding: 'clamp(8px,2vw,14px) clamp(12px,3vw,26px) 0', background: '#F5F6FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500, marginBottom: '18px' }}>
          <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <Link href={`/${uniSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>Subjects</Link>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <Link href={`/${uniSlug}/${subjectSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{subject.name}</Link>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <span style={{ color: '#1B2335', fontWeight: 700 }}>{lecture.title}</span>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', padding: '22px 26px', marginBottom: '16px', background: 'linear-gradient(120deg,rgb(237,243,255) 0%,rgb(243,247,255) 52%,rgb(252,253,255) 100%)', border: '1px solid rgb(226,234,251)', boxShadow: 'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.4) 0px 20px 42px -30px' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '70px', width: '230px', height: '130px', background: 'radial-gradient(rgba(147,197,253,0.34) 0%,rgba(196,181,253,0.13) 55%,transparent 75%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '15px', background: 'linear-gradient(150deg,rgb(59,121,255),rgb(47,107,255))', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
            </span>
            <div style={{ paddingTop: '2px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.025em', color: 'rgb(21,32,58)' }}>{lecture.title}</h1>
              <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'rgb(47,107,255)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(47,107,255)', flexShrink: 0 }} />
                {subject.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 clamp(12px,3vw,26px) 24px' }}>
        {locked ? <LockedContentCard subjectName={subject.name} />
        : sheetLoading ? <ContentSkeleton />
        : !sheet ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>No sheet available for this lecture.</p>
          </div>
        ) : (
          <SheetReader
            content={sheet.content ?? ''}
            title={lecture.title}
            onProgressUpdate={handleProgressUpdate}
            userName={displayName}
            imageSlots={imageSlots}
          />
        )}
      </div>
    </>
  )
}
