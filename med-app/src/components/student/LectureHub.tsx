'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import LectureRightSidebar from '@/components/student/LectureRightSidebar'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lecture {
  id: string
  title: string
  description: string | null
  status: string
  updated_at: string
  subject_id: string | null
  chapter_id: string | null
  sub_subject_id: string | null
}

interface Sheet {
  id: string
  content: string | null
  status: string
  updated_at: string
}

interface Summary {
  id: string
  content: string | null
  status: string
  updated_at: string
}

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  tags: string[]
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
  tags: string[]
}

interface PreviousYearQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string | null
  explanation: string | null
  exam_year: number | null
  exam_type: string | null
}

interface TocSection {
  id: string
  level: number
  label: string
}

interface LectureHubProps {
  lecture: Lecture
  sheet: Sheet | null
  summary: Summary | null
  flashcards: Flashcard[]
  quizQuestions: QuizQuestion[]
  previousYearQuestions: PreviousYearQuestion[]
  isLocked: boolean
  universityId: string
  subjectId: string
  subjectName: string
  chapterName?: string
}

// ── Tab definitions ────────────────────────────────────────────────────────────

const ALL_TABS = [
  { id: 'sheet',          label: 'Sheet',          icon: 'ti-file-text' },
  { id: 'summary',        label: 'Summary',         icon: 'ti-file-description' },
  { id: 'flashcards',     label: 'Flashcards',      icon: 'ti-cards' },
  { id: 'quiz',           label: 'Quiz',            icon: 'ti-help-circle' },
  { id: 'previous_years', label: 'Previous Years',  icon: 'ti-clock-history' },
]

// ── Extract TOC from MN Syntax content ────────────────────────────────────────

function extractToc(content: string): TocSection[] {
  const lines = content.split('\n')
  const toc: TocSection[] = []
  lines.forEach((line, idx) => {
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    if (h1) toc.push({ id: `heading-${idx}`, level: 1, label: h1[1].trim() })
    else if (h2) toc.push({ id: `heading-${idx}`, level: 2, label: h2[1].trim() })
    else if (h3) toc.push({ id: `heading-${idx}`, level: 3, label: h3[1].trim() })
  })
  return toc
}

// ── Format date safely ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown date'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Unknown date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function LectureHub({
  lecture,
  sheet,
  summary,
  flashcards,
  quizQuestions,
  previousYearQuestions,
  isLocked,
  universityId,
  subjectId,
  subjectName,
  chapterName,
}: LectureHubProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  // Available tabs — only show tabs that have content
  const availableTabs = ALL_TABS.filter((t) => {
    if (t.id === 'sheet')          return !!sheet
    if (t.id === 'summary')        return !!summary
    if (t.id === 'flashcards')     return flashcards.length > 0
    if (t.id === 'quiz')           return quizQuestions.length > 0
    if (t.id === 'previous_years') return previousYearQuestions.length > 0
    return false
  })

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id ?? 'sheet')
  const [progressPercent, setProgressPercent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Flashcard stats lifted from FlashcardsViewer
  const [flashcardStats, setFlashcardStats] = useState({
    total: flashcards.length,
    easy: 0,
    medium: 0,
    hard: 0,
    current: 1,
  })

  // Quiz stats lifted from QuizViewer
  const [quizStats, setQuizStats] = useState({
    total: quizQuestions.length,
    answered: 0,
    correct: 0,
    current: 1,
  })

  // TOC extracted from sheet/summary content
  const tocSections = activeTab === 'sheet'
    ? extractToc(sheet?.content ?? '')
    : activeTab === 'summary'
    ? extractToc(summary?.content ?? '')
    : []

  // Load progress + bookmark on mount
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

  // Scroll to TOC section
  function handleTocClick(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Mark complete
  async function handleMarkComplete() {
    if (!user) return
    const next = !isCompleted
    setIsCompleted(next)
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

  // Toggle bookmark
  async function handleToggleBookmark() {
    if (!user) return
    if (isBookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id)
        .eq('lecture_id', lecture.id)
        .eq('bookmark_type', 'lecture')
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        lecture_id: lecture.id,
        bookmark_type: 'lecture',
      })
      setIsBookmarked(true)
    }
  }

  // Save progress from SheetReader scroll
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

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: MAIN CONTENT ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── LECTURE HEADER ── */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pt-5 pb-0 flex-shrink-0">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-4" aria-label="Breadcrumb">
            <Link href={`/${universityId}`} className="hover:text-blue-600 transition-colors">
              Subjects
            </Link>
            <i className="ti ti-chevron-right text-[11px]" aria-hidden="true" />
            <Link href={`/${universityId}/${subjectId}`} className="hover:text-blue-600 transition-colors truncate max-w-[120px]">
              {subjectName}
            </Link>
            {chapterName && (
              <>
                <i className="ti ti-chevron-right text-[11px]" aria-hidden="true" />
                <span className="truncate max-w-[100px]">{chapterName}</span>
              </>
            )}
            <i className="ti ti-chevron-right text-[11px]" aria-hidden="true" />
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">{lecture.title}</span>
          </nav>

          {/* Title + meta */}
          <div className="mb-4">
            <h1 className="text-[24px] font-bold text-slate-900 dark:text-white leading-tight mb-1.5">
              {lecture.title}
            </h1>
            <div className="flex items-center gap-4 text-[12px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <i className="ti ti-calendar text-[13px]" aria-hidden="true" />
                Last updated: {formatDate(lecture.updated_at)}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <i className="ti ti-circle-check-filled text-[13px]" aria-hidden="true" />
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <i className={`ti ${tab.icon} text-[14px]`} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="flex-1 overflow-hidden">
          {isLocked ? (
            <div className="p-8">
              <LockedContentCard subjectId={subjectId} universityId={universityId} />
            </div>
          ) : (
            <>
              {activeTab === 'sheet' && sheet && (
                <SheetReader
                  content={sheet.content ?? ''}
                  title={lecture.title}
                  onProgressUpdate={handleProgressUpdate}
                  userName={user?.full_name ?? ''}
                  tocSections={tocSections}
                />
              )}
              {activeTab === 'summary' && summary && (
                <SheetReader
                  content={summary.content ?? ''}
                  title={lecture.title}
                  isSummary
                  onProgressUpdate={handleProgressUpdate}
                  userName={user?.full_name ?? ''}
                  tocSections={tocSections}
                />
              )}
              {activeTab === 'flashcards' && (
                <FlashcardsViewer
                  flashcards={flashcards}
                  userName={user?.full_name ?? ''}
                  onStatsChange={setFlashcardStats}
                />
              )}
              {activeTab === 'quiz' && (
                <QuizViewer
                  questions={quizQuestions}
                  lectureId={lecture.id}
                  onStatsChange={setQuizStats}
                />
              )}
              {activeTab === 'previous_years' && (
                <PreviousYearsViewer
                  questions={previousYearQuestions}
                  lectureId={lecture.id}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ──────────────────────────────────────────── */}
      <LectureRightSidebar
        lectureId={lecture.id}
        subjectId={subjectId}
        universityId={universityId}
        activeTab={activeTab}
        tocSections={tocSections}
        onTocClick={handleTocClick}
        progressPercent={progressPercent}
        flashcardStats={activeTab === 'flashcards' ? flashcardStats : undefined}
        quizStats={activeTab === 'quiz' ? quizStats : undefined}
        isCompleted={isCompleted}
        isBookmarked={isBookmarked}
        onMarkComplete={handleMarkComplete}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  )
}