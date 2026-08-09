'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useQuery } from '@tanstack/react-query'
import SheetReader from '@/components/student/SheetReader'
import LockedContentCard from '@/components/student/LockedContentCard'

interface TocSection {
  id: string; level: number; label: string; h1Num: number; h2Num: number | null
}

function extractToc(content: string): TocSection[] {
  const lines = content.split('\n')
  const toc: TocSection[] = []
  let h1Counter = 0; let h2Counter = 0
  lines.forEach((line) => {
    const h1 = line.match(/^#\s+(.+)/); const h2 = line.match(/^##\s+(.+)/); const h3 = line.match(/^###\s+(.+)/)
    if (h1) {
      h1Counter++; h2Counter = 0
      const label = h1[1].trim()
      toc.push({ id: `section-${label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`, level: 1, label, h1Num: h1Counter, h2Num: null })
    } else if (h2) {
      h2Counter++
      const label = h2[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`
      if (h1Counter === 0) { h1Counter++; h2Counter = 0; toc.push({ id, level: 1, label, h1Num: h1Counter, h2Num: null }) }
      else { toc.push({ id, level: 2, label, h1Num: h1Counter, h2Num: h2Counter }) }
    } else if (h3) {
      const label = h3[1].trim()
      toc.push({ id: `section-${label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`, level: 3, label, h1Num: h1Counter, h2Num: h2Counter })
    }
  })
  return toc
}

function emitSidebar(type: string, data: unknown) {
  window.dispatchEvent(new CustomEvent('lecture-sidebar-update', { detail: { type, data } }))
}

export default function SummaryPage() {
  const params      = useParams()
  const uniSlug     = params.uniSlug     as string
  const subjectSlug = params.subjectSlug as string
  const lectureSlug = params.lectureSlug as string

  const { user } = useUserStore()
  const supabase = useMemo(() => createClient(), [])

  const lastSavedPct  = useRef<number>(-1)
  const saveTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollApplied = useRef(false)

  const { data: meta } = useQuery({
    queryKey: ['summary-meta', lectureSlug, subjectSlug],
    queryFn: async () => {
      const [{ data: lecture }, { data: subject }, { data: { user: authUser } }] = await Promise.all([
        supabase.from('lectures').select('id, title').eq('slug' as any, lectureSlug).single(),
        supabase.from('subjects').select('id, name, access_mode, is_free').eq('slug' as any, subjectSlug).single(),
        supabase.auth.getUser(),
      ])
      let userId: string | null = null
      let accessAllowed = subject?.access_mode === 'free' || subject?.is_free === true
      if (authUser) {
        const { data: profile } = await supabase.from('users').select('id').eq('auth_user_id', authUser.id).single()
        userId = profile?.id ?? null
        if (!accessAllowed && userId) {
          const now = new Date().toISOString()
          const { data: sub } = await supabase.from('subject_subscriptions')
            .select('id').eq('user_id', userId).eq('subject_id', subject?.id ?? '').eq('status', 'active').gt('end_date', now).maybeSingle()
          accessAllowed = !!sub
        }
      }
      return { lecture, subject, userId, accessAllowed }
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary-full', meta?.lecture?.id, meta?.userId],
    queryFn: async () => {
      const lectureId = meta!.lecture!.id
      const userId    = meta!.userId

      const [summaryResult, progressResult] = await Promise.all([
        supabase.from('summaries').select('id, content, status').eq('lecture_id', lectureId).maybeSingle(),
        userId
          ? supabase.from('user_progress')
              .select('progress_percentage, completed, last_position')
              .eq('user_id', userId).eq('lecture_id', lectureId).eq('content_type', 'summary')
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      const summaryId = summaryResult.data?.id ?? ''
      const slotsResult = summaryId
        ? await supabase.from('image_slots')
            .select('slot_number, media_library(file_url)')
            .eq('entity_id', summaryId).eq('entity_type', 'summary')
        : { data: [] }

      const imageSlots: Record<number, string> = {}
      for (const slot of (slotsResult.data ?? []) as any[]) {
        const url = (slot as any).media_library?.file_url
        if (url) imageSlots[slot.slot_number] = url
      }

      const progress = (progressResult as any).data
      return {
        summary: summaryResult.data,
        imageSlots,
        savedPct:      progress?.progress_percentage ?? 0,
        savedPosition: progress?.last_position       ?? 0,
        completed:     progress?.completed           ?? false,
      }
    },
    enabled: !!meta?.lecture?.id,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!summaryData) return
    emitSidebar('progress', { percent: summaryData.savedPct, completed: summaryData.completed })
    if (summaryData.summary?.content) {
      emitSidebar('toc', { sections: extractToc(summaryData.summary.content) })
      emitSidebar('summaryContent', { content: summaryData.summary.content })
    }
  }, [summaryData])

  useEffect(() => {
    if (scrollApplied.current) return
    if (!summaryData) return

    const localKey = meta?.lecture?.id ? `Lecture:${meta.lecture.id}:summary_scroll` : null
    const localVal = localKey ? localStorage.getItem(localKey) : null
    const targetScroll = localVal ? parseInt(localVal, 10) : (summaryData.savedPosition ?? 0)

    if (targetScroll <= 0) { scrollApplied.current = true; return }
    scrollApplied.current = true

    let attempts = 0
    const maxAttempts = 50

    function tryScroll() {
      const el = document.getElementById('lecture-content-scroll')
      if (!el) { attempts++; if (attempts < maxAttempts) setTimeout(tryScroll, 100); return }
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll < targetScroll * 0.9 && attempts < maxAttempts) {
        attempts++
        setTimeout(tryScroll, 100)
        return
      }
      el.scrollTo({ top: targetScroll, behavior: 'smooth' })
    }

    setTimeout(tryScroll, 200)
  }, [summaryData, meta?.lecture?.id])

  const handleProgressUpdate = useCallback((pct: number) => {
    emitSidebar('progress', { percent: pct, completed: pct >= 100 })

    const scrollEl  = document.getElementById('lecture-content-scroll')
    const scrollPos = scrollEl?.scrollTop ?? 0
    if (meta?.lecture?.id) {
      localStorage.setItem(`Lecture:${meta.lecture.id}:summary_scroll`, String(scrollPos))
    }

    if (!user || !meta?.lecture?.id || !meta?.userId) return
    if (Math.abs(pct - lastSavedPct.current) < 2) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      lastSavedPct.current = pct
      const el  = document.getElementById('lecture-content-scroll')
      const pos = el?.scrollTop ?? 0
      supabase.from('user_progress').upsert({
        user_id:             meta.userId!,
        lecture_id:          meta.lecture!.id,
        content_type:        'summary',
        progress_percentage: pct,
        completed:           pct >= 100,
        last_position:       pos,
        last_accessed_at:    new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })
    }, 2000)
  }, [user, meta, supabase])

  useEffect(() => {
    if (!meta?.userId || !meta?.lecture?.id) return
    function handleUnload() {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const el  = document.getElementById('lecture-content-scroll')
      const pos = el?.scrollTop ?? 0
      if (meta?.lecture?.id) localStorage.setItem(`Lecture:${meta.lecture.id}:summary_scroll`, String(pos))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [meta?.userId, meta?.lecture?.id])

  const TAB_ICONS: Record<string, React.ReactNode> = {
    sheet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
    summary: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>,
    flashcards: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    quiz: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    'previous-years': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  }
  const TAB_LABELS: Record<string, string> = { sheet: 'Sheet', summary: 'Summary', flashcards: 'Flashcards', quiz: 'Quiz', 'previous-years': 'Previous Years' }

  const subject     = meta?.subject
  const summary     = summaryData?.summary
  const imageSlots  = summaryData?.imageSlots ?? {}
  const locked      = !meta?.accessAllowed
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
      <div className="lg:hidden flex gap-1 px-4 pt-3 pb-2 bg-white border-b border-slate-100 overflow-x-auto" style={{ flexShrink: 0 }}>
        {['sheet','summary','flashcards','quiz','previous-years'].map((tabId) => {
          const isActive = tabId === 'summary'
          return (
            <a key={tabId} href={`/${uniSlug}/${subjectSlug}/${lectureSlug}/${tabId}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 600 : 500, background: isActive ? '#EEF3FF' : '#F3F4F6', color: isActive ? '#2563EB' : '#6B7280', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
              {TAB_ICONS[tabId]}{TAB_LABELS[tabId]}
            </a>
          )
        })}
      </div>

      <div style={{ padding: 'clamp(8px,2vw,14px) clamp(12px,3vw,26px) 0', background: '#F5F6FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500, marginBottom: '18px' }}>
          <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <a href={`/${uniSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>Subjects</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <a href={`/${uniSlug}/${subjectSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{subject?.name ?? ''}</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <span style={{ color: '#1B2335', fontWeight: 700 }}>{meta?.lecture?.title ?? ''}</span>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', padding: '22px 26px', marginBottom: '16px', background: 'linear-gradient(120deg,rgb(237,243,255) 0%,rgb(243,247,255) 52%,rgb(252,253,255) 100%)', border: '1px solid rgb(226,234,251)', boxShadow: 'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.4) 0px 20px 42px -30px' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '70px', width: '230px', height: '130px', background: 'radial-gradient(rgba(147,197,253,0.34) 0%,rgba(196,181,253,0.13) 55%,transparent 75%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '15px', background: 'linear-gradient(150deg,rgb(59,121,255),rgb(47,107,255))', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>
            </span>
            <div style={{ paddingTop: '2px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.025em', color: 'rgb(21,32,58)' }}>{meta?.lecture?.title ?? ''}</h1>
              <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'rgb(47,107,255)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(47,107,255)', flexShrink: 0 }} />
                {subject?.name ?? ''} — Summary
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 clamp(12px,3vw,26px) 24px' }}>
        {!meta ? <ContentSkeleton />
        : locked ? <LockedContentCard subjectName={subject?.name ?? ''} />
        : summaryLoading ? <ContentSkeleton />
        : !summary ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>No summary available for this lecture.</p>
          </div>
        ) : (
          <SheetReader
            content={summary.content ?? ''}
            title={meta.lecture?.title ?? ''}
            isSummary
            onProgressUpdate={handleProgressUpdate}
            userName={displayName}
            imageSlots={imageSlots}
          />
        )}
      </div>
    </>
  )
}
