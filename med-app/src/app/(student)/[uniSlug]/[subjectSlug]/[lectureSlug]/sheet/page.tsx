'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useQuery } from '@tanstack/react-query'
import SheetReader from '@/components/student/SheetReader'
import LockedContentCard from '@/components/student/LockedContentCard'

// ── TOC Extractor ──────────────────────────────────────────────────────────

interface TocSection {
  id: string
  level: number
  label: string
  h1Num: number
  h2Num: number | null
}

function extractToc(content: string): TocSection[] {
  const lines = content.split('\n')
  const toc: TocSection[] = []
  let h1Counter = 0
  let h2Counter = 0
  lines.forEach((line) => {
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    if (h1) {
      h1Counter++; h2Counter = 0
      const label = h1[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 1, label, h1Num: h1Counter, h2Num: null })
    } else if (h2) {
      h2Counter++
      const label = h2[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      if (h1Counter === 0) { h1Counter++; h2Counter = 0; toc.push({ id, level: 1, label, h1Num: h1Counter, h2Num: null }) }
      else { toc.push({ id, level: 2, label, h1Num: h1Counter, h2Num: h2Counter }) }
    } else if (h3) {
      const label = h3[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 3, label, h1Num: h1Counter, h2Num: h2Counter })
    }
  })
  return toc
}

// ── Sidebar event emitter ──────────────────────────────────────────────────

function emitSidebar(type: string, data: unknown) {
  window.dispatchEvent(new CustomEvent('lecture-sidebar-update', { detail: { type, data } }))
}

// ── Sheet Page ─────────────────────────────────────────────────────────────

export default function SheetPage() {
  const params    = useParams()
  const uniSlug   = params.uniSlug   as string
  const subjectSlug = params.subjectSlug as string
  const lectureSlug = params.lectureSlug as string

  const { user }  = useUserStore()
  const supabase  = useMemo(() => createClient(), [])

  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedPct      = useRef<number>(-1)
  const resumeSaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRestored    = useRef(false)

  // ── Fetch lecture + subject + access ──────────────────────────────────────
  const { data: meta } = useQuery({
    queryKey: ['sheet-meta', lectureSlug, subjectSlug],
    queryFn: async () => {
      const [
        { data: lecture },
        { data: subject },
        { data: { user: authUser } },
      ] = await Promise.all([
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

  // ── Fetch sheet content ───────────────────────────────────────────────────
  const { data: sheetData, isLoading: sheetLoading } = useQuery({
    queryKey: ['sheet-content', meta?.lecture?.id],
    queryFn: async () => {
      const lectureId = meta!.lecture!.id
      const [sheetResult, slotsResult] = await Promise.all([
        supabase.from('sheets').select('id, content, status').eq('lecture_id', lectureId).maybeSingle(),
        supabase.from('image_slots').select('slot_number, image_url').eq('lecture_id', lectureId).eq('content_type', 'sheet'),
      ])
      const imageSlots: Record<number, string> = {}
      for (const slot of slotsResult.data ?? []) {
        imageSlots[slot.slot_number] = slot.image_url
      }
      return { sheet: sheetResult.data, imageSlots }
    },
    enabled: !!meta?.lecture?.id,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  // ── Fetch resume state ────────────────────────────────────────────────────
  const { data: resumeState } = useQuery({
    queryKey: ['resume-state', user?.id, meta?.lecture?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('lecture_resume_state')
        .select('sheet_scroll, active_tab')
        .eq('user_id', user!.id)
        .eq('lecture_id', meta!.lecture!.id)
        .maybeSingle()
      return data as { sheet_scroll: number; active_tab: string } | null
    },
    enabled: !!user?.id && !!meta?.lecture?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  // ── Fetch saved progress ──────────────────────────────────────────────────
  const { data: savedProgress } = useQuery({
    queryKey: ['progress', user?.id, meta?.lecture?.id, 'sheet'],
    queryFn: async () => {
      const { data } = await supabase.from('user_progress')
        .select('progress_percentage, completed')
        .eq('user_id', user!.id)
        .eq('lecture_id', meta!.lecture!.id)
        .eq('content_type', 'sheet')
        .maybeSingle()
      return data
    },
    enabled: !!user?.id && !!meta?.lecture?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  // ── Restore scroll after content loads ───────────────────────────────────
  useEffect(() => {
    if (scrollRestored.current) return
    if (!sheetData) return
    if (!resumeState) return
    const targetScroll = resumeState.sheet_scroll ?? 0
    if (targetScroll <= 0) return
    scrollRestored.current = true
    setTimeout(() => {
      const el = document.getElementById('lecture-content-scroll')
      if (el) el.scrollTo({ top: targetScroll, behavior: 'smooth' })
    }, 400)
  }, [sheetData, resumeState])

  // ── Send initial progress to sidebar ─────────────────────────────────────
  useEffect(() => {
    if (!savedProgress) return
    emitSidebar('progress', {
      percent: savedProgress.progress_percentage ?? 0,
      completed: savedProgress.completed ?? false,
    })
  }, [savedProgress])

  // ── Send TOC to sidebar when content loads ────────────────────────────────
  useEffect(() => {
    if (!sheetData?.sheet?.content) return
    const sections = extractToc(sheetData.sheet.content)
    emitSidebar('toc', { sections })
    emitSidebar('sheetContent', { content: sheetData.sheet.content })
  }, [sheetData?.sheet?.content])

  // ── Save resume state (debounced) ─────────────────────────────────────────
  const saveResumeState = useCallback((scrollPos: number) => {
    if (!user || !meta?.lecture?.id) return
    if (resumeSaveTimer.current) clearTimeout(resumeSaveTimer.current)
    resumeSaveTimer.current = setTimeout(async () => {
      await (supabase as any).rpc('save_resume_state', {
        p_user_id:         user.id,
        p_lecture_id:      meta.lecture!.id,
        p_active_tab:      'sheet',
        p_sheet_scroll:    scrollPos,
        p_summary_scroll:  0,
        p_flashcard_index: 0,
        p_quiz_index:      0,
        p_pyq_index:       0,
      })
    }, 1500)
  }, [user, meta?.lecture?.id, supabase])

  // ── Handle progress update from SheetReader ───────────────────────────────
  const handleProgressUpdate = useCallback((pct: number) => {
    emitSidebar('progress', { percent: pct, completed: pct >= 100 })
    if (!user || !meta?.lecture?.id) return
    if (Math.abs(pct - lastSavedPct.current) < 3) return
    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current)
    progressSaveTimer.current = setTimeout(() => {
      lastSavedPct.current = pct
      const scrollEl = document.getElementById('lecture-content-scroll')
      const scrollPos = scrollEl?.scrollTop ?? 0
      supabase.from('user_progress').upsert({
        user_id:             user.id,
        lecture_id:          meta.lecture!.id,
        content_type:        'sheet',
        progress_percentage: pct,
        completed:           pct >= 100,
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })
      saveResumeState(scrollPos)
    }, 3000)
  }, [user, meta?.lecture?.id, supabase, saveResumeState])

  // ── Mobile tab bar ────────────────────────────────────────────────────────
  const TAB_ICONS: Record<string, React.ReactNode> = {
    sheet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
    summary: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/></svg>,
    flashcards: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    quiz: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    'previous-years': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  }
  const TAB_LABELS: Record<string, string> = { sheet: 'Sheet', summary: 'Summary', flashcards: 'Flashcards', quiz: 'Quiz', 'previous-years': 'Previous Years' }

  // ── Render ────────────────────────────────────────────────────────────────

  const subject     = meta?.subject
  const sheet       = sheetData?.sheet
  const imageSlots  = sheetData?.imageSlots ?? {}
  const locked      = !meta?.accessAllowed
  const displayName = user?.full_name ?? ''

  const ContentSkeleton = () => (
    <div style={{ padding: '24px 0' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: i === 0 ? '28px' : '16px', background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)', borderRadius: '8px', marginBottom: '16px', width: i % 3 === 2 ? '60%' : '100%', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
    </div>
  )

  return (
    <>
      {/* Mobile tab bar */}
      <div className="lg:hidden flex gap-1 px-4 pt-3 pb-2 bg-white border-b border-slate-100 overflow-x-auto" style={{ flexShrink: 0 }}>
        {['sheet', 'summary', 'flashcards', 'quiz', 'previous-years'].map((tabId) => {
          const isActive = tabId === 'sheet'
          return (
            <a key={tabId} href={`/${uniSlug}/${subjectSlug}/${lectureSlug}/${tabId}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 600 : 500, background: isActive ? '#EEF3FF' : '#F3F4F6', color: isActive ? '#2563EB' : '#6B7280', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
              {TAB_ICONS[tabId]}
              {TAB_LABELS[tabId]}
            </a>
          )
        })}
      </div>

      {/* Hero card */}
      <div style={{ padding: 'clamp(8px, 2vw, 14px) clamp(12px, 3vw, 26px) 0', background: '#F5F6FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500, marginBottom: '18px' }}>
          <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <a href={`/${uniSlug}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Subjects</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <a href={`/${uniSlug}/${subjectSlug}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>{subject?.name ?? ''}</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <span style={{ color: '#1B2335', fontWeight: 700 }}>{meta?.lecture?.title ?? ''}</span>
        </div>

        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', padding: '22px 26px', marginBottom: '16px', background: 'linear-gradient(120deg,rgb(237,243,255) 0%,rgb(243,247,255) 52%,rgb(252,253,255) 100%)', border: '1px solid rgb(226,234,251)', boxShadow: 'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.4) 0px 20px 42px -30px' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '70px', width: '230px', height: '130px', background: 'radial-gradient(rgba(147,197,253,0.34) 0%,rgba(196,181,253,0.13) 55%,transparent 75%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '15px', background: 'linear-gradient(150deg,rgb(59,121,255),rgb(47,107,255))', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
            </span>
            <div style={{ paddingTop: '2px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.025em', color: 'rgb(21,32,58)' }}>{meta?.lecture?.title ?? ''}</h1>
              <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'rgb(47,107,255)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(47,107,255)', flexShrink: 0 }} />
                {subject?.name ?? ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 clamp(12px, 3vw, 26px) 24px' }}>
        {locked ? (
          <LockedContentCard subjectName={subject?.name ?? ''} />
        ) : sheetLoading || !meta ? (
          <ContentSkeleton />
        ) : !sheet ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>No sheet available for this lecture.</p>
          </div>
        ) : (
          <SheetReader
            content={sheet.content ?? ''}
            title={meta.lecture?.title ?? ''}
            onProgressUpdate={handleProgressUpdate}
            userName={displayName}
            imageSlots={imageSlots}
          />
        )}
      </div>
    </>
  )
}
