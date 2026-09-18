'use client'

import { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useQuery } from '@tanstack/react-query'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'
import { useLectureData } from '@/components/student/LectureDataProvider'
import LectureMobileTabs from '@/components/student/LectureMobileTabs'

function emitSidebar(type: string, data: unknown) {
  window.dispatchEvent(new CustomEvent('lecture-sidebar-update', { detail: { type, data } }))
}

function getLocalKey(lectureId: string) {
  return `lecture:${lectureId}:flashcard_index`
}

export default function FlashcardsPage() {
  const params      = useParams()
  const uniSlug     = params.uniSlug     as string
  const subjectSlug = params.subjectSlug as string
  const lectureSlug = params.lectureSlug as string

  const { lecture, subject, accessAllowed } = useLectureData()
  const { user } = useUserStore()
  const supabase = useMemo(() => createClient(), [])
  const dbSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentIndexRef = useRef<number>(0)

  const [resolvedIndex, setResolvedIndex] = useState<number | null>(null)

  const { data: flashcardsData, isLoading: flashcardsLoading } = useQuery({
    queryKey: ['flashcards-content', lecture.id],
    queryFn: async () => {
      const { data } = await supabase.from('flashcards')
        .select('id, front_text, back_text, tags')
        .eq('lecture_id', lecture.id)
      return data ?? []
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (resolvedIndex !== null) return

    const localKey = getLocalKey(lecture.id)
    const local = localStorage.getItem(localKey)
    if (local !== null) {
      const idx = parseInt(local, 10)
      if (!isNaN(idx) && idx > 0) {
        setResolvedIndex(idx)
        currentIndexRef.current = idx
        return
      }
    }

    if (!user?.id) { setResolvedIndex(0); return }

    ;(supabase as any)
      .from('lecture_resume_state')
      .select('flashcard_index')
      .eq('user_id', user.id)
      .eq('lecture_id', lecture.id)
      .maybeSingle()
      .then(({ data }: { data: { flashcard_index: number } | null }) => {
        const idx = data?.flashcard_index ?? 0
        setResolvedIndex(idx)
        currentIndexRef.current = idx
        if (idx > 0) localStorage.setItem(localKey, String(idx))
      })
  }, [lecture.id, user?.id])

  const saveIndex = useCallback((index: number) => {
    currentIndexRef.current = index
    localStorage.setItem(getLocalKey(lecture.id), String(index))

    if (!user?.id) return
    if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current)
    dbSaveTimer.current = setTimeout(async () => {
      await (supabase as any).rpc('save_resume_state', {
        p_user_id:         user.id,
        p_lecture_id:      lecture.id,
        p_active_tab:      'flashcards',
        p_sheet_scroll:    null,
        p_summary_scroll:  null,
        p_flashcard_index: index,
        p_quiz_index:      null,
        p_pyq_index:       null,
      })
    }, 2000)
  }, [lecture.id, user?.id, supabase])

  useEffect(() => {
    if (!user?.id) return
    function handleUnload() {
      if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current)
      const body = JSON.stringify({
        p_user_id:         user!.id,
        p_lecture_id:      lecture.id,
        p_active_tab:      'flashcards',
        p_flashcard_index: currentIndexRef.current,
      })
      navigator.sendBeacon('/api/save-resume', body)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [lecture.id, user?.id])

  const handleIndexChange = useCallback((index: number) => {
    saveIndex(index)
  }, [saveIndex])

  const handleStatsChange = useCallback((stats: { total: number; easy: number; medium: number; hard: number; current: number; important: number }) => {
    emitSidebar('flashcardStats', stats)
  }, [])

  const flashcards  = flashcardsData ?? []
  const locked      = !accessAllowed
  const displayName = user?.full_name ?? ''

  const ContentSkeleton = () => (
    <div style={{ padding: '24px 0' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: i === 0 ? '200px' : '16px', background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)', borderRadius: '12px', marginBottom: '16px', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
    </div>
  )

  return (
    <>
      <LectureMobileTabs activeTab="flashcards" />

      <div style={{ padding: 'clamp(8px, 2vw, 14px) clamp(12px, 3vw, 26px) 0', background: '#F5F6FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500, marginBottom: '18px' }}>
          <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <a href={`/${uniSlug}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Subjects</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <a href={`/${uniSlug}/${subjectSlug}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>{subject.name}</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <span style={{ color: '#1B2335', fontWeight: 700 }}>{lecture.title}</span>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', padding: '22px 26px', marginBottom: '16px', background: 'linear-gradient(120deg,rgb(237,243,255) 0%,rgb(243,247,255) 52%,rgb(252,253,255) 100%)', border: '1px solid rgb(226,234,251)', boxShadow: 'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.4) 0px 20px 42px -30px' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '70px', width: '230px', height: '130px', background: 'radial-gradient(rgba(147,197,253,0.34) 0%,rgba(196,181,253,0.13) 55%,transparent 75%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '15px', background: 'linear-gradient(150deg,rgb(59,121,255),rgb(47,107,255))', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </span>
            <div style={{ paddingTop: '2px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.025em', color: 'rgb(21,32,58)' }}>{lecture.title}</h1>
              <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'rgb(47,107,255)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(47,107,255)', flexShrink: 0 }} />
                {subject.name} — Flashcards
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 clamp(12px, 3vw, 26px) 24px' }}>
        {locked ? (
          <LockedContentCard subjectName={subject.name} />
        ) : flashcardsLoading || resolvedIndex === null ? (
          <ContentSkeleton />
        ) : flashcards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>No flashcards available for this lecture.</p>
          </div>
        ) : (
          <FlashcardsViewer
            key={`flashcards-${resolvedIndex}`}
            flashcards={flashcards as any}
            userName={displayName}
            initialIndex={resolvedIndex}
            onIndexChange={handleIndexChange}
            onStatsChange={handleStatsChange}
          />
        )}
      </div>
    </>
  )
}