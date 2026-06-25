'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'
import { useQuery } from '@tanstack/react-query'

interface Lecture {
  id: string
  title: string
  description: string | null
  status: string
}

interface Subject {
  id: string
  name: string
  access_mode: string | null
  is_free: boolean | null
}

interface Sheet {
  id: string
  content: string | null
  status: string
  updated_at: string | null
}

interface Summary {
  id: string
  content: string | null
  status: string
  updated_at: string | null
}

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  tags: string[] | null
}

interface QuizQuestion {
  id: string
  question: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  option_e: string | null
  correct_answer: string | null
  explanation: string | null
  tags: string[] | null
}

interface PreviousYearQuestion {
  id: string
  question: string
  options: unknown
  correct_answer: string | null
  explanation: string | null
  exam_year: number | null
  exam_type: string | null
}

interface Video {
  id: string
  title: string
  description: string | null
  video_url: string
  is_preview: boolean | null
  display_order: number | null
}

export interface TocSection {
  id: string
  level: number
  label: string
}

export interface FlashcardStats {
  total: number
  easy: number
  medium: number
  hard: number
  current: number
  important: number
}

export interface QuizStats {
  total: number
  answered: number
  correct: number
  current: number
  important: number
}

interface LectureHubProps {
  lecture: Lecture
  subject: Subject
  universityId: string
  userName?: string
  userId?: string
  sheet: Sheet | null
  sheetLocked: boolean
  summary: Summary | null
  summaryLocked: boolean
  flashcards: Flashcard[]
  flashcardsLocked: boolean
  quizQuestions: QuizQuestion[]
  quizLocked: boolean
  previousYearQuestions: PreviousYearQuestion[]
  pyqLocked: boolean
  videos: Video[]
  sheetImageSlots: Record<number, string>
  summaryImageSlots: Record<number, string>
}

const TAB_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  sheet: {
    label: 'Sheet',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="13" y2="17"/>
      </svg>
    ),
  },
  summary: {
    label: 'Summary',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="11" y2="17"/>
      </svg>
    ),
  },
  flashcards: {
    label: 'Flashcards',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  quiz: {
    label: 'Quiz',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  previous_years: {
    label: 'Previous Years',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
}

const ALL_TABS = ['sheet', 'summary', 'flashcards', 'quiz', 'previous_years']

export function extractToc(content: string): TocSection[] {
  const lines = content.split('\n')
  const toc: TocSection[] = []
  lines.forEach((line) => {
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    if (h1) {
      const label = h1[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 1, label })
    } else if (h2) {
      const label = h2[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 2, label })
    } else if (h3) {
      const label = h3[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 3, label })
    }
  })
  return toc
}

export default function LectureHub({
  lecture,
  subject,
  universityId,
  userName,
  userId,
  sheet,
  sheetLocked,
  summary,
  summaryLocked,
  flashcards,
  flashcardsLocked,
  quizQuestions,
  quizLocked,
  previousYearQuestions,
  pyqLocked,
  videos,
  sheetImageSlots,
  summaryImageSlots,
}: LectureHubProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  const availableTabs = ALL_TABS.filter((t) => {
    if (t === 'sheet')          return !!sheet || sheetLocked
    if (t === 'summary')        return !!summary || summaryLocked
    if (t === 'flashcards')     return flashcards.length > 0 || flashcardsLocked
    if (t === 'quiz')           return quizQuestions.length > 0 || quizLocked
    if (t === 'previous_years') return previousYearQuestions.length > 0 || pyqLocked
    return false
  })

  const [activeTab, setActiveTab]           = useState(availableTabs[0] ?? 'sheet')
  const [progressPercent, setProgressPercent] = useState(0)
  const [isCompleted, setIsCompleted]       = useState(false)
  const [isBookmarked, setIsBookmarked]     = useState(false)
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({
    total: flashcards.length, easy: 0, medium: 0, hard: 0, current: 1, important: 0,
  })
  const [quizStats, setQuizStats] = useState<QuizStats>({
    total: quizQuestions.length, answered: 0, correct: 0, current: 1, important: 0,
  })
  const [pyqStats, setPyqStats] = useState({
    total: previousYearQuestions.length, important: 0, answered: 0,
  })

  const tocSections: TocSection[] =
    activeTab === 'sheet'   ? extractToc(sheet?.content ?? '') :
    activeTab === 'summary' ? extractToc(summary?.content ?? '') : []

  const isCurrentTabLocked =
    (activeTab === 'sheet'          && sheetLocked)     ||
    (activeTab === 'summary'        && summaryLocked)    ||
    (activeTab === 'flashcards'     && flashcardsLocked) ||
    (activeTab === 'quiz'           && quizLocked)       ||
    (activeTab === 'previous_years' && pyqLocked)

  const { data: progressData } = useQuery({
    queryKey: ['progress', user?.id, lecture.id, activeTab],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('progress_percentage, completed')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
        .eq('content_type', activeTab)
        .maybeSingle()
      return data ?? null
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const { data: bookmarkData } = useQuery({
    queryKey: ['bookmark', 'lecture', user?.id, lecture.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
        .eq('bookmark_type', 'lecture')
        .maybeSingle()
      return data ?? null
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    setProgressPercent(progressData?.progress_percentage ?? 0)
    setIsCompleted(progressData?.completed ?? false)
  }, [progressData])

  useEffect(() => {
    setIsBookmarked(!!bookmarkData)
  }, [bookmarkData])

  function handleTocClick(id: string) {
    const el = document.getElementById(id)
    const scrollContainer = document.getElementById('lecture-content-scroll')
    if (el && scrollContainer) {
      const elTop = el.getBoundingClientRect().top
      const containerTop = scrollContainer.getBoundingClientRect().top
      const offset = elTop - containerTop + scrollContainer.scrollTop - 120
      scrollContainer.scrollTo({ top: offset, behavior: 'smooth' })
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function handleMarkComplete() {
    if (!user) return
    const next = !isCompleted
    setIsCompleted(next)
    setProgressPercent(next ? 100 : progressPercent)
    await supabase.from('user_progress').upsert({
      user_id: user.id,
      lecture_id: lecture.id,
      content_type: activeTab,
      progress_percentage: next ? 100 : progressPercent,
      completed: next,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
  }

  async function handleToggleBookmark() {
    if (!user) return
    if (isBookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id).eq('lecture_id', lecture.id).eq('bookmark_type', 'lecture')
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id, lecture_id: lecture.id, bookmark_type: 'lecture',
      })
      setIsBookmarked(true)
    }
  }

  function handleProgressUpdate(pct: number) {
    setProgressPercent(pct)
    if (!user) return
    supabase.from('user_progress').upsert({
      user_id: user.id,
      lecture_id: lecture.id,
      content_type: activeTab,
      progress_percentage: pct,
      completed: pct >= 100,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
  }

  const displayName = userName ?? user?.full_name ?? ''

  const lectureStats = {
    flashcards: flashcards.length,
    quiz: quizQuestions.length,
    pyq: previousYearQuestions.length,
    sections: tocSections.filter(t => t.level === 1 || t.level === 2).length,
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden', position: 'relative' }}>

      {/* ── CENTER: scrollable content ── */}
      <div
        id="lecture-content-scroll"
        className="flex-1 min-w-0"
        style={{ overflowY: 'auto', height: 'calc(100vh - 72px)', background: '#F5F6FA' }}
      >
        {/* Mobile tabs — visible only on mobile */}
        <div className="lg:hidden flex gap-1 px-4 pt-3 pb-2 bg-white border-b border-slate-100 overflow-x-auto" style={{ flexShrink: 0 }}>
          {availableTabs.map((tabId) => {
            const cfg = TAB_CONFIG[tabId]
            const isActive = activeTab === tabId
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? '#EEF3FF' : '#F3F4F6',
                  color: isActive ? '#2563EB' : '#6B7280',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Hero card */}
        <div style={{ padding: 'clamp(12px, 3vw, 22px) clamp(12px, 3vw, 26px) 0', background: '#F5F6FA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500, marginBottom: '18px' }}>
            <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <Link href={`/${universityId}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Subjects</Link>
            <span style={{ color: '#C5CBD6' }}>/</span>
            <Link href={`/${universityId}/${subject.id}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>{subject.name}</Link>
            <span style={{ color: '#C5CBD6' }}>/</span>
            <span style={{ color: '#1B2335', fontWeight: 700 }}>{lecture.title}</span>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', padding: 'clamp(14px, 4vw, 28px) clamp(14px, 4vw, 30px) clamp(12px, 3vw, 24px)', marginBottom: '16px', background: 'linear-gradient(120deg,#E8F0FF 0%,#EFF4FF 46%,#FAFBFF 100%)', border: '1px solid #DFE8FB', boxShadow: '0 1px 2px rgba(16,24,40,.04),0 22px 46px -30px rgba(40,90,200,.4)' }}>
            {/* Pink glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '320px', height: '160px', background: 'radial-gradient(ellipse at center, rgba(249,168,212,0.3) 0%, rgba(216,180,254,0.15) 55%, transparent 75%)', pointerEvents: 'none', borderRadius: '50%', filter: 'blur(24px)', zIndex: 0 }} />
            <div className="hidden sm:flex" style={{ position: 'absolute', top: '24px', right: '28px', flexDirection: 'column', alignItems: 'flex-end', gap: '9px' }}>
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius:'20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Completed
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius:'20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  In Progress
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '12.5px', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>

            {/* Mobile badges row */}
            <div className="flex sm:hidden gap-2 mb-3 flex-wrap">
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius:'20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '11px', fontWeight: 700 }}>✓ Completed</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius:'20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '11px', fontWeight: 700 }}>In Progress</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '11px', fontWeight: 700 }}>
                ★ {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height:'54px', borderRadius: '15px', background: 'linear-gradient(150deg,#3B79FF,#2F6BFF)', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
              </span>
              <div style={{ paddingTop: '2px' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 40px)', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.025em', color: '#15203A' }}>{lecture.title}</h1>
                <div style={{ marginTop: '7px', fontSize: '15px', fontWeight: 600, color: '#2F6BFF' }}>{subject.name}</div>
              </div>
            </div>

            {(activeTab === 'sheet' || activeTab === 'summary') && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', marginTop: '22px' }}>
                <div style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0 }}>
                  <svg width="54" height="54" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#D6E2FB" strokeWidth="7"/>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#2F6BFF" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray="163.36"
                      strokeDashoffset={163.36 - (163.36 * progressPercent / 100)}
                      transform="rotate(-90 32 32)"
                      style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#2F6BFF' }}>{progressPercent}%</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.04em', color: '#6B7689', textTransform: 'uppercase' }}>Reading Progress</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#2F6BFF' }}>{progressPercent}% read</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '6px', background: '#D9E3F8', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: '6px', background: 'linear-gradient(90deg,#3B79FF,#2F6BFF)', transition: 'width .25s ease' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '0 clamp(12px, 3vw, 26px) 120px' }}>
          {isCurrentTabLocked ? (
            <LockedContentCard subjectName={subject.name} />
          ) : (
            <>
              {activeTab === 'sheet' && sheet && (
                <SheetReader
                  content={sheet.content ?? ''}
                  title={lecture.title}
                  onProgressUpdate={handleProgressUpdate}
                  userName={displayName}
                  tocSections={tocSections}
                />
              )}
              {activeTab === 'summary' && summary && (
                <SheetReader
                  content={summary.content ?? ''}
                  title={lecture.title}
                  isSummary
                  onProgressUpdate={handleProgressUpdate}
                  userName={displayName}
                  tocSections={tocSections}
                />
              )}
              {activeTab === 'flashcards' && (
                <FlashcardsViewer
                  flashcards={flashcards as any}
                  userName={displayName}
                  onStatsChange={setFlashcardStats}
                />
              )}
              {activeTab === 'quiz' && (
                <QuizViewer
                  questions={quizQuestions as any}
                  lectureId={lecture.id}
                  userName={displayName}
                  onStatsChange={setQuizStats}
                />
              )}
              {activeTab === 'previous_years' && (
                <PreviousYearsViewer
                  questions={previousYearQuestions as any}
                  userName={displayName}
                  onStatsChange={setPyqStats}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR — desktop only ── */}
      <aside
        id="lecture-right-sidebar"
        className="hidden lg:flex"
        style={{
          width: '272px',
          height: 'calc(100vh - 72px)',
          overflowY: 'auto',
          borderLeft: '1px solid #EEF0F4',
          background: '#F7F8FA',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 12px',
          flexShrink: 0,
        }}
      >
        {/* ── CONTENT CARD ── */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #EAEDF2',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding: '14px 16px 10px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Content
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {availableTabs.map((tabId) => {
                const cfg = TAB_CONFIG[tabId]
                const isActive = activeTab === tabId
                return (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? '#EEF3FF' : 'transparent',
                      color: isActive ? '#2563EB' : '#6B7280',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isActive ? '#DBEAFE' : '#F3F4F6',
                        color: isActive ? '#2563EB' : '#9CA3AF',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}>
                        {cfg.icon}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 500 }}>
                        {cfg.label}
                      </span>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isActive ? '#2563EB' : '#D1D5DB'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── READING PROGRESS CARD ── */}
        {(activeTab === 'sheet' || activeTab === 'summary') && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #EAEDF2',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Reading Progress
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              {/* Circle */}
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                  <circle
                    cx="28" cy="28" r="22"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="138.23"
                    strokeDashoffset={138.23 - (138.23 * progressPercent / 100)}
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB' }}>{progressPercent}%</span>
                </div>
              </div>
              {/* Text */}
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                  {progressPercent >= 100 ? 'Finished!' : progressPercent > 0 ? 'Keep reading' : 'Keep reading'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                  {progressPercent >= 100 ? 'Great job!' : progressPercent > 0 ? `${progressPercent}% done` : 'Not started'}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: '6px', borderRadius: '999px', background: '#EEF0F4', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── FLASHCARD STATS CARD ── */}
        {activeTab === 'flashcards' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #EAEDF2',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Progress
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray="138.23"
                    strokeDashoffset={flashcardStats.total > 0 ? 138.23 - (138.23 * flashcardStats.current / flashcardStats.total) : 138.23}
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB' }}>{flashcardStats.current}/{flashcardStats.total}</span>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Card {flashcardStats.current}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>{flashcardStats.total - flashcardStats.current} remaining</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <StatPill label="Total" value={flashcardStats.total} color="blue" />
              <StatPill label="Important" value={flashcardStats.important} color="amber" />
            </div>
          </div>
        )}

        {/* ── QUIZ STATS CARD ── */}
        {activeTab === 'quiz' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #EAEDF2',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Quiz Progress
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <StatPill label="Total" value={quizStats.total} color="blue" />
              <StatPill label="Correct" value={quizStats.correct} color="green" />
              <StatPill label="Answered" value={quizStats.answered} color="slate" />
              <StatPill label="Important" value={quizStats.important} color="amber" />
            </div>
          </div>
        )}

        {/* ── PYQ STATS CARD ── */}
        {activeTab === 'previous_years' && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #EAEDF2',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Previous Years
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <StatPill label="Total" value={pyqStats.total} color="blue" />
              <StatPill label="Important" value={pyqStats.important} color="amber" />
              <StatPill label="Answered" value={pyqStats.answered} color="green" />
            </div>
          </div>
        )}

        {/* ── TABLE OF CONTENTS CARD ── */}
        {tocSections.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #EAEDF2',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Table of Contents
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '260px', overflowY: 'auto' }}>
              {tocSections
                .filter(s => s.level <= 2)
                .map((section, idx) => (
                  <button
                    key={section.id}
                    onClick={() => handleTocClick(section.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: section.level === 1 ? 600 : 500,
                      color: section.level === 1 ? '#1E293B' : '#475569',
                      lineHeight: 1.4,
                    }}>
                      {section.label}
                    </span>
                  </button>
                ))}
            </nav>
          </div>
        )}

        {/* ── NOTES CARD ── */}
        <NotesPanel lectureId={lecture.id} />

        {/* ── ACTIONS CARD ── */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #EAEDF2',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Actions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleMarkComplete}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                background: isCompleted ? '#16A34A' : '#EEF3FF',
                color: isCompleted ? '#fff' : '#2563EB',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isCompleted
                  ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
                  : <circle cx="12" cy="12" r="10"/>
                }
              </svg>
              {isCompleted ? 'Completed' : 'Mark as Completed'}
            </button>
            <button
              onClick={handleToggleBookmark}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #EAEDF2',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                background: isBookmarked ? '#FFF7ED' : '#fff',
                color: isBookmarked ? '#D97706' : '#6B7280',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? '#D97706' : 'none'} stroke={isBookmarked ? '#D97706' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <Link
              href={`/${universityId}/${subject.id}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #EAEDF2',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6B7280',
                background: '#fff',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to Subject
            </Link>
          </div>
        </div>

        {/* bottom spacing */}
        <div style={{ height: '8px' }} />
      </aside>
    </div>
  )
}

// ── Stat Pill ──────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'amber' | 'slate' }) {
  const bg    = color === 'blue' ? '#EFF6FF' : color === 'green' ? '#F0FDF4' : color === 'amber' ? '#FFFBEB' : '#F8FAFC'
  const text  = color === 'blue' ? '#2563EB' : color === 'green' ? '#16A34A' : color === 'amber' ? '#D97706' : '#64748B'
  const sub   = color === 'blue' ? '#3B82F6' : color === 'green' ? '#22C55E' : color === 'amber' ? '#F59E0B' : '#94A3B8'
  return (
    <div style={{ background: bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: text }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
    </div>
  )
}

// ── Notes Panel ────────────────────────────────────────────────────────────

function NotesPanel({ lectureId }: { lectureId: string }) {
  const { user } = useUserStore()
  const supabase = createClient()
  const [note, setNote]     = useState('')
  const [saved, setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [noteId, setNoteId] = useState<string | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('user_notes')
        .select('id, note_content')
        .eq('user_id', user!.id)
        .eq('lecture_id', lectureId)
        .maybeSingle()
      if (data) { setNote(data.note_content ?? ''); setNoteId(data.id) }
      setLoading(false)
    }
    load()
  }, [user, lectureId])

  function handleChange(val: string) {
    setNote(val)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(val), 1500)
  }

  async function saveNote(content: string) {
    if (!user) return
    if (noteId) {
      await supabase.from('user_notes')
        .update({ note_content: content, updated_at: new Date().toISOString() })
        .eq('id', noteId)
    } else {
      const { data } = await supabase.from('user_notes')
        .insert({ user_id: user.id, lecture_id: lectureId, note_content: content })
        .select('id').maybeSingle()
      if (data) setNoteId(data.id)
    }
    setSaved(true)
  }

  if (!user) return null

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #EAEDF2',
      padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          My Notes
        </p>
        {saved && (
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 600 }}>✓ Saved</span>
        )}
        {!saved && note.length > 0 && (
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>Saving...</span>
        )}
      </div>
      {loading ? (
        <div style={{ height: '80px', background: '#F1F5F9', borderRadius: '10px' }} />
      ) : (
        <textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your notes here..."
          rows={4}
          style={{
            width: '100%',
            fontSize: '12.5px',
            color: '#374151',
            background: '#FEFCE8',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            padding: '10px',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.6,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}