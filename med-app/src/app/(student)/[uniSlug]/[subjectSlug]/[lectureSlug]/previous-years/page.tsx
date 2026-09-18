'use client'

import { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useQuery } from '@tanstack/react-query'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'
import { useLectureData } from '@/components/student/LectureDataProvider'
import LectureMobileTabs from '@/components/student/LectureMobileTabs'

function emitSidebar(type: string, data: unknown) {
  window.dispatchEvent(new CustomEvent('lecture-sidebar-update', { detail: { type, data } }))
}

export default function PreviousYearsPage() {
  const params      = useParams()
  const uniSlug     = params.uniSlug     as string
  const subjectSlug = params.subjectSlug as string

  const { lecture, subject, userId, accessAllowed } = useLectureData()
  const { user } = useUserStore()
  const supabase = useMemo(() => createClient(), [])

  const [resolvedIndex, setResolvedIndex] = useState<number | null>(null)
  const [savedAnswers, setSavedAnswers]   = useState<Record<string, string> | null>(null)

  const isReadyRef      = useRef(false)
  const indexSaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentIndexRef = useRef<number>(0)

  const { data: pyqData, isLoading: pyqLoading } = useQuery({
    queryKey: ['pyq-content', lecture.id],
    queryFn: async () => {
      const { data } = await supabase.from('previous_year_questions')
        .select('id, question, options, correct_answer, explanation, exam_year, exam_type')
        .eq('lecture_id', lecture.id)
      return data ?? []
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (resolvedIndex !== null) return

    if (!userId) {
      setResolvedIndex(0)
      setSavedAnswers({})
      return
    }

    async function loadSavedState() {
      const [progressResult, attemptsResult] = await Promise.all([
        supabase.from('user_progress')
          .select('last_position')
          .eq('user_id', userId!)
          .eq('lecture_id', lecture.id)
          .eq('content_type', 'previous_years')
          .maybeSingle(),
        supabase.from('lecture_question_attempts' as any)
          .select('question_id, selected_answer')
          .eq('user_id', userId!)
          .eq('lecture_id', lecture.id)
          .eq('question_type', 'pyq'),
      ])
      const savedPosition = (progressResult.data as any)?.last_position ?? 0
      const attempts = (attemptsResult.data ?? []) as unknown as { question_id: string; selected_answer: string }[]
      const answersMap: Record<string, string> = {}
      for (const a of attempts) answersMap[a.question_id] = a.selected_answer

      setResolvedIndex(savedPosition)
      currentIndexRef.current = savedPosition
      setSavedAnswers(answersMap)
    }

    loadSavedState()
  }, [lecture.id, userId])

  const saveIndex = useCallback((index: number) => {
    currentIndexRef.current = index
    if (!userId) return

    if (indexSaveTimer.current) clearTimeout(indexSaveTimer.current)
    indexSaveTimer.current = setTimeout(() => {
      supabase.from('user_progress').upsert({
        user_id:             userId,
        lecture_id:          lecture.id,
        content_type:        'previous_years',
        progress_percentage: 0,
        completed:           false,
        last_position:       index,
        last_accessed_at:    new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })
    }, 1500)
  }, [userId, lecture.id, supabase])

  useEffect(() => {
    function handleUnload() {
      if (!userId) return
      if (indexSaveTimer.current) clearTimeout(indexSaveTimer.current)
      supabase.from('user_progress').upsert({
        user_id:             userId,
        lecture_id:          lecture.id,
        content_type:        'previous_years',
        progress_percentage: 0,
        completed:           false,
        last_position:       currentIndexRef.current,
        last_accessed_at:    new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [userId, lecture.id, supabase])

  const saveAnswer = useCallback(async (questionId: string, selectedAnswer: string, isCorrect: boolean) => {
    if (!userId) return
    await supabase.from('lecture_question_attempts' as any).upsert({
      user_id:         userId,
      lecture_id:      lecture.id,
      question_id:     questionId,
      question_type:   'pyq',
      selected_answer: selectedAnswer,
      is_correct:      isCorrect,
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,question_id,question_type' })
  }, [userId, lecture.id, supabase])

  // Kept exactly as originally coded — only resets position, does not clear saved
  // answers. Flagged separately below for your decision; not changed here.
  const resetPosition = useCallback(async () => {
    if (!userId) return
    if (indexSaveTimer.current) clearTimeout(indexSaveTimer.current)
    setResolvedIndex(0)
    currentIndexRef.current = 0
    await supabase.from('user_progress').upsert({
      user_id:             userId,
      lecture_id:          lecture.id,
      content_type:        'previous_years',
      progress_percentage: 0,
      completed:           false,
      last_position:       0,
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
  }, [userId, lecture.id, supabase])

  useEffect(() => {
    if (resolvedIndex === null) return
    const t = setTimeout(() => { isReadyRef.current = true }, 2000)
    return () => clearTimeout(t)
  }, [resolvedIndex])

  const handleIndexChange = useCallback((index: number) => {
    if (!isReadyRef.current) return
    saveIndex(index)
  }, [saveIndex])

  const handleStatsChange = useCallback((stats: { total: number; important: number; answered: number }) => {
    emitSidebar('pyqStats', stats)
  }, [])

  const questions   = pyqData ?? []
  const locked      = !accessAllowed
  const displayName = user?.full_name ?? ''

  const ContentSkeleton = () => (
    <div style={{ padding: '24px 0' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: i === 0 ? '200px' : '16px', background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)', borderRadius: '12px', marginBottom: '16px', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  )

  return (
    <>
      <LectureMobileTabs activeTab="previous-years" />

      <div style={{ padding: 'clamp(8px,2vw,14px) clamp(12px,3vw,26px) 0', background: '#F5F6FA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500, marginBottom: '18px' }}>
          <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <a href={`/${uniSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>Subjects</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <a href={`/${uniSlug}/${subjectSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{subject.name}</a>
          <span style={{ color: '#C5CBD6' }}>/</span>
          <span style={{ color: '#1B2335', fontWeight: 700 }}>{lecture.title}</span>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', padding: '22px 26px', marginBottom: '16px', background: 'linear-gradient(120deg,rgb(237,243,255) 0%,rgb(243,247,255) 52%,rgb(252,253,255) 100%)', border: '1px solid rgb(226,234,251)', boxShadow: 'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.4) 0px 20px 42px -30px' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '70px', width: '230px', height: '130px', background: 'radial-gradient(rgba(147,197,253,0.34) 0%,rgba(196,181,253,0.13) 55%,transparent 75%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '15px', background: 'linear-gradient(150deg,rgb(59,121,255),rgb(47,107,255))', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <div style={{ paddingTop: '2px', minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.025em', color: 'rgb(21,32,58)' }}>{lecture.title}</h1>
                <div style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'rgb(47,107,255)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(47,107,255)', flexShrink: 0 }} />
                  {subject.name} — Previous Years
                </div>
              </div>
            </div>
            {userId && (resolvedIndex ?? 0) > 0 && (
              <button onClick={resetPosition}
                style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '10px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Start Over
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 clamp(12px,3vw,26px) 24px' }}>
        {locked ? <LockedContentCard subjectName={subject.name} />
        : pyqLoading || resolvedIndex === null || savedAnswers === null ? <ContentSkeleton />
        : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>No previous year questions available for this lecture.</p>
          </div>
        ) : (
          <PreviousYearsViewer
            key="pyq-viewer"
            questions={questions as any}
            userName={displayName}
            initialIndex={resolvedIndex}
            initialAnswers={savedAnswers!}
            lectureId={lecture.id}
            onAnswerSelect={saveAnswer}
            onIndexChange={handleIndexChange}
            onStatsChange={handleStatsChange}
          />
        )}
      </div>
    </>
  )
}