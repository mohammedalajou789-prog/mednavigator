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

const ALL_TABS = [
  { id: 'sheet',          label: 'Sheet',         icon: '📄' },
  { id: 'summary',        label: 'Summary',        icon: '📝' },
  { id: 'flashcards',     label: 'Flashcards',     icon: '🃏' },
  { id: 'quiz',           label: 'Quiz',           icon: '❓' },
  { id: 'previous_years', label: 'Previous Years', icon: '📅' },
]

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
    if (t.id === 'sheet')          return !!sheet || sheetLocked
    if (t.id === 'summary')        return !!summary || summaryLocked
    if (t.id === 'flashcards')     return flashcards.length > 0 || flashcardsLocked
    if (t.id === 'quiz')           return quizQuestions.length > 0 || quizLocked
    if (t.id === 'previous_years') return previousYearQuestions.length > 0 || pyqLocked
    return false
  })

  const [activeTab, setActiveTab]             = useState(availableTabs[0]?.id ?? 'sheet')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.getElementById('lecture-content-scroll')
    if (!el) return
    let last = false
    const onScroll = () => {
      const isReadingTab = activeTab === 'sheet' || activeTab === 'summary'
      const next = isReadingTab && el.scrollTop > 80
      if (next !== last) { last = next; setScrolled(next) }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [activeTab])
  const [progressPercent, setProgressPercent] = useState(0)
  const [isCompleted, setIsCompleted]         = useState(false)
  const [isBookmarked, setIsBookmarked]       = useState(false)
  const [flashcardStats, setFlashcardStats]   = useState<FlashcardStats>({
    total: flashcards.length, easy: 0, medium: 0, hard: 0, current: 1, important: 0,
  })
  const [quizStats, setQuizStats] = useState<QuizStats>({
    total: quizQuestions.length, answered: 0, correct: 0, current: 1, important: 0,
  })
  const [pyqStats, setPyqStats] = useState({ total: previousYearQuestions.length, important: 0, answered: 0 })
  

  const tocSections: TocSection[] =
    activeTab === 'sheet'   ? extractToc(sheet?.content ?? '') :
    activeTab === 'summary' ? extractToc(summary?.content ?? '') : []

  const isCurrentTabLocked =
    (activeTab === 'sheet'          && sheetLocked)     ||
    (activeTab === 'summary'        && summaryLocked)    ||
    (activeTab === 'flashcards'     && flashcardsLocked) ||
    (activeTab === 'quiz'           && quizLocked)       ||
    (activeTab === 'previous_years' && pyqLocked)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: prog } = await supabase
        .from('user_progress')
        .select('progress_percentage, completed')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
        .eq('content_type', activeTab)
        .maybeSingle()
      if (prog) {
        setProgressPercent(prog.progress_percentage ?? 0)
        setIsCompleted(prog.completed ?? false)
      } else {
        setProgressPercent(0)
        setIsCompleted(false)
      }
      const { data: bm } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
        .eq('bookmark_type', 'lecture')
        .maybeSingle()
      setIsBookmarked(!!bm)
    }
    load()
  }, [user, lecture.id, activeTab])

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
    // This outer div fills whatever height the parent gives us
    <div className="flex" style={{ height: '100%', overflow: 'hidden' }}>

      {/* ── CENTER: only this scrolls ── */}
      <div
        id="lecture-content-scroll"
        className="flex-1 min-w-0"
        style={{ overflowY: 'auto', height: '100%', background: '#F5F6FA' }}
      >
        {/* Hero card */}
        <div style={{ padding: '22px 26px 0', background: '#F5F6FA' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#7A8499', fontWeight: 500 }}>
              <svg style={{ color: '#9AA3B2' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <Link href={`/${universityId}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>Subjects</Link>
              <span style={{ color: '#C5CBD6' }}>/</span>
              <Link href={`/${universityId}/${subject.id}`} style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>{subject.name}</Link>
              <span style={{ color: '#C5CBD6' }}>/</span>
              <span style={{ color: '#1B2335', fontWeight: 700 }}>{lecture.title}</span>
            </div>
          </div>

          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '22px', padding: '28px 30px 24px', marginBottom: '22px', background: 'linear-gradient(120deg,#E8F0FF 0%,#EFF4FF 46%,#FAFBFF 100%)', border: '1px solid #DFE8FB', boxShadow: '0 1px 2px rgba(16,24,40,.04),0 22px 46px -30px rgba(40,90,200,.4)' }}>
            {/* Badges top right */}
            <div style={{ position: 'absolute', top: '24px', right: '28px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '9px' }}>
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Completed
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  In Progress
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '12.5px', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>

            {/* Title */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '15px', background: 'linear-gradient(150deg,#3B79FF,#2F6BFF)', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
              </span>
              <div style={{ paddingTop: '2px' }}>
                <h1 style={{ margin: 0, fontSize: '40px', lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.025em', color: '#15203A' }}>{lecture.title}</h1>
                <div style={{ marginTop: '7px', fontSize: '15px', fontWeight: 600, color: '#2F6BFF' }}>{subject.name}</div>
              </div>
            </div>

            {/* Progress bar */}
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

        {/* Content */}
        <div style={{ padding: '0 26px 120px' }}>
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
                  flashcards={flashcards}
                  userName={displayName}
                  onStatsChange={setFlashcardStats}
                />
              )}
              {activeTab === 'quiz' && (
                <QuizViewer
                  questions={quizQuestions}
                  lectureId={lecture.id}
                  userName={displayName}
                  onStatsChange={setQuizStats}
                />
              )}
              {activeTab === 'previous_years' && (
                <PreviousYearsViewer
                  questions={previousYearQuestions}
                  userName={displayName}
                  onStatsChange={setPyqStats}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR: never scrolls with content ── */}
      <aside
        className="flex-shrink-0 bg-white dark:bg-slate-900 flex flex-col"
        style={{ width: '300px', height: '100%', overflowY: 'auto', borderLeft: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* CONTENT SWITCHER */}
        <div className="p-4 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Content
          </p>
          <div className="space-y-0.5">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                  }
                `}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* READING PROGRESS */}
        {(activeTab === 'sheet' || activeTab === 'summary') && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Reading Progress
            </p>
            <div className="flex items-center gap-3 mb-2">
              <CircleProgress pct={progressPercent} />
              <div>
                <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
                  {progressPercent}% read
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {progressPercent >= 100 ? '🎉 Finished!' : progressPercent > 0 ? 'Keep going' : 'Not started'}
                </p>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* FLASHCARD STATS */}
        {activeTab === 'flashcards' && flashcardStats && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Progress
            </p>
            <div className="flex items-center gap-3 mb-3">
              <CircleProgress
                pct={flashcardStats.total > 0
                  ? Math.round((flashcardStats.current / flashcardStats.total) * 100)
                  : 0}
              />
              <div>
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  Card {flashcardStats.current} of {flashcardStats.total}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {flashcardStats.total - flashcardStats.current} remaining
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-blue-600 dark:text-blue-400">{flashcardStats.total}</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-500 font-medium">Total</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-amber-500 dark:text-amber-400">{flashcardStats.important}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">⭐ Important</p>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ STATS */}
        {activeTab === 'quiz' && quizStats && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Quiz Progress
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-blue-600 dark:text-blue-400">{quizStats.total}</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-500 font-medium">Total</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-amber-500 dark:text-amber-400">{quizStats.important}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">⭐ Important</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-green-600 dark:text-green-400">{quizStats.correct}</p>
                <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">Correct</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-slate-600 dark:text-slate-300">{quizStats.answered}</p>
                <p className="text-[10px] text-slate-500 font-medium">Done</p>
              </div>
            </div>
          </div>
        )}

        {/* PYQ STATS */}
        {activeTab === 'previous_years' && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Previous Years
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-blue-600 dark:text-blue-400">{pyqStats.total}</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-500 font-medium">Total</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-amber-500 dark:text-amber-400">{pyqStats.important}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">⭐ Important</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <p className="text-[16px] font-bold text-green-600 dark:text-green-400">{pyqStats.answered}</p>
                <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">Answered</p>
              </div>
            </div>
          </div>
        )}

        {/* TABLE OF CONTENTS */}
        {tocSections.length > 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Table of Contents
            </p>
            <nav className="space-y-0.5 max-h-[260px] overflow-y-auto">
              {tocSections.map((section, idx) => (
                <button
                  key={section.id}
                  onClick={() => handleTocClick(section.id)}
                  className="w-full flex items-start gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                >
                  {section.level <= 2 && (
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                  )}
                  <span className={`
                    text-[12px] leading-snug transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400
                    ${section.level === 1 ? 'font-semibold text-slate-700 dark:text-slate-200' :
                      section.level === 2 ? 'font-medium text-slate-600 dark:text-slate-300' :
                      'text-slate-500 dark:text-slate-400 pl-4'}
                  `}>
                    {section.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* MY NOTES */}
        <NotesPanel lectureId={lecture.id} />

        {/* LECTURE INFO */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Lecture Info
          </p>
          <div className="space-y-1.5">
            {lectureStats.sections > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">Sections</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{lectureStats.sections}</span>
              </div>
            )}
            {lectureStats.flashcards > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">Flashcards</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{lectureStats.flashcards}</span>
              </div>
            )}
            {lectureStats.quiz > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">Quiz Questions</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{lectureStats.quiz}</span>
              </div>
            )}
            {lectureStats.pyq > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">Previous Years</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{lectureStats.pyq}</span>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="p-4 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Actions
          </p>
          <div className="space-y-2">
            <button
              onClick={handleMarkComplete}
              className={`
                w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200
                ${isCompleted
                  ? 'bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-300 dark:ring-green-700'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300'
                }
              `}
            >
              <i className={`ti ${isCompleted ? 'ti-circle-check-filled' : 'ti-circle'} text-[15px]`} />
              {isCompleted ? '✓ Completed' : 'Mark as Completed'}
            </button>
            <button
              onClick={handleToggleBookmark}
              className={`
                w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium border transition-all duration-200
                ${isBookmarked
                  ? 'bg-amber-500 border-amber-500 text-white ring-2 ring-amber-200 dark:ring-amber-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600'
                }
              `}
            >
              <i className={`ti ${isBookmarked ? 'ti-bookmark-filled' : 'ti-bookmark'} text-[14px]`} />
              {isBookmarked ? '★ Bookmarked' : 'Bookmark'}
            </button>
            <Link
              href={`/${universityId}/${subject.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <i className="ti ti-arrow-left text-[14px]" />
              Back to Subject
            </Link>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Notes Panel ────────────────────────────────────────────────────────────────

function NotesPanel({ lectureId }: { lectureId: string }) {
  const { user } = useUserStore()
  const supabase = createClient()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
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
    <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          My Notes
        </p>
        {saved && (
          <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
            <i className="ti ti-check text-[11px]" /> Saved
          </span>
        )}
        {!saved && note.length > 0 && (
          <span className="text-[10px] text-slate-400">Saving...</span>
        )}
      </div>
      {loading ? (
        <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
      ) : (
        <textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your notes here..."
          rows={4}
          className="w-full text-[12.5px] text-slate-700 dark:text-slate-200 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 resize-none outline-none focus:border-amber-400 dark:focus:border-amber-600 placeholder-slate-400 transition-all leading-relaxed"
        />
      )}
    </div>
  )
}

// ── Circle Progress ────────────────────────────────────────────────────────────

function CircleProgress({ pct, color = 'blue' }: { pct: number; color?: 'blue' | 'green' | 'amber' | 'red' }) {
  const CIRC = 157.08
  const offset = CIRC - (CIRC * pct) / 100
  const stroke =
    color === 'green' ? '#16A34A' :
    color === 'amber' ? '#D97706' :
    color === 'red'   ? '#DC2626' : '#2563EB'
  return (
    <div className="relative w-[48px] h-[48px] flex-shrink-0">
      <svg width="48" height="48" viewBox="0 0 52 52" className="rotate-[-90deg]">
        <circle cx="26" cy="26" r="22" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-700" />
        <circle cx="26" cy="26" r="22" fill="none" stroke={stroke} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{pct}%</span>
      </div>
    </div>
  )
}