'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import LectureRightSidebar from '@/components/student/LectureRightSidebar'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Tab definitions ───────────────────────────────────────────────────────────

const ALL_TABS = [
  { id: 'sheet', label: 'Sheet', icon: 'ti-file-text' },
  { id: 'summary', label: 'Summary', icon: 'ti-file-description' },
  { id: 'flashcards', label: 'Flashcards', icon: 'ti-cards' },
  { id: 'quiz', label: 'Quiz', icon: 'ti-help-circle' },
  { id: 'previous_years', label: 'Previous Years', icon: 'ti-clock-history' },
]

// ── Component ─────────────────────────────────────────────────────────────────

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
  const supabase = createBrowserClient()

  // Determine which tabs actually have content
  const availableTabs = ALL_TABS
    .filter((t) => {
      if (t.id === 'sheet') return !!sheet
      if (t.id === 'summary') return !!summary
      if (t.id === 'flashcards') return flashcards.length > 0
      if (t.id === 'quiz') return quizQuestions.length > 0
      if (t.id === 'previous_years') return previousYearQuestions.length > 0
      return false
    })
    .map((t) => t.id)

  // Default to first available tab
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0] ?? 'sheet')

  // Progress and user-specific state
  const [progressPercent, setProgressPercent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [lastNote, setLastNote] = useState<{ content: string; updatedAt: string } | null>(null)

  // Load user progress + bookmark + notes on mount
  useEffect(() => {
    if (!user) return

    async function loadState() {
      // Progress
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

      // Bookmark
      const { data: bm } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
        .eq('bookmark_type', 'lecture')
        .maybeSingle()

      setIsBookmarked(!!bm)

      // Last note
      const { data: note } = await supabase
        .from('user_notes')
        .select('note_content, updated_at')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (note) {
        setLastNote({ content: note.note_content ?? '', updatedAt: note.updated_at })
      }
    }

    loadState()
  }, [user, lecture.id, activeTab])

  // Mark as completed
  async function handleMarkComplete() {
    if (!user) return
    const newCompleted = !isCompleted
    setIsCompleted(newCompleted)

    await supabase.from('user_progress').upsert({
      user_id: user.id,
      lecture_id: lecture.id,
      content_type: activeTab,
      progress_percentage: newCompleted ? 100 : progressPercent,
      completed: newCompleted,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
  }

  // Toggle bookmark
  async function handleToggleBookmark() {
    if (!user) return
    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
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

  // Receive progress updates from SheetReader
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

  const displayTabs = ALL_TABS.filter((t) => availableTabs.includes(t.id))

  const lastUpdated = new Date(lecture.updated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: MAIN CONTENT ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Breadcrumb + lecture header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pt-4 pb-0 flex-shrink-0">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3" aria-label="Breadcrumb">
            <Link href={`/${universityId}`} className="hover:text-blue-600 transition-colors">
              Subjects
            </Link>
            <i className="ti ti-chevron-right text-[11px]" aria-hidden="true" />
            <Link href={`/${universityId}/${subjectId}`} className="hover:text-blue-600 transition-colors">
              {subjectName}
            </Link>
            {chapterName && (
              <>
                <i className="ti ti-chevron-right text-[11px]" aria-hidden="true" />
                <span className="text-slate-400">{chapterName}</span>
              </>
            )}
            <i className="ti ti-chevron-right text-[11px]" aria-hidden="true" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">{lecture.title}</span>
          </nav>

          {/* Lecture title row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold text-slate-900 dark:text-white leading-tight mb-1">
                {lecture.title}
              </h1>
              <div className="flex items-center gap-3 text-[12px] text-slate-400">
                <span className="flex items-center gap-1">
                  <i className="ti ti-calendar text-[13px]" aria-hidden="true" />
                  Last updated: {lastUpdated}
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                    <i className="ti ti-circle-check-filled text-[13px]" aria-hidden="true" />
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs — only tabs with content are shown */}
          <div className="flex items-center gap-0 overflow-x-auto">
            {displayTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-200'
                  }
                `}
              >
                <i className={`ti ${tab.icon} text-[15px]`} aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          {isLocked ? (
            <div className="p-8">
              <LockedContentCard
                subjectId={subjectId}
                universityId={universityId}
              />
            </div>
          ) : (
            <>
              {activeTab === 'sheet' && sheet && (
                <SheetReader
                  content={sheet.content ?? ''}
                  lectureId={lecture.id}
                  onProgressUpdate={handleProgressUpdate}
                />
              )}
              {activeTab === 'summary' && summary && (
                <SheetReader
                  content={summary.content ?? ''}
                  lectureId={lecture.id}
                  onProgressUpdate={handleProgressUpdate}
                />
              )}
              {activeTab === 'flashcards' && (
                <FlashcardsViewer
                  flashcards={flashcards}
                  lectureId={lecture.id}
                />
              )}
              {activeTab === 'quiz' && (
                <QuizViewer
                  questions={quizQuestions}
                  lectureId={lecture.id}
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

      {/* ── RIGHT: SIDEBAR ──────────────────────────────────────────── */}
      <LectureRightSidebar
        lectureId={lecture.id}
        subjectId={subjectId}
        universityId={universityId}
        progressPercent={progressPercent}
        isCompleted={isCompleted}
        isBookmarked={isBookmarked}
        onMarkComplete={handleMarkComplete}
        onToggleBookmark={handleToggleBookmark}
        lastNote={lastNote}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableTabs={availableTabs}
      />
    </div>
  )
}