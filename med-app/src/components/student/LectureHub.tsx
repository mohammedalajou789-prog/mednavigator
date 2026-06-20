'use client'

import { useState } from 'react'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'

interface Lecture {
  id: string
  title: string
  description?: string | null
  status: string
}

interface Subject {
  id: string
  name: string
  access_mode?: string | null
  is_free?: boolean | null
}

interface LectureHubProps {
  lecture: Lecture
  subject: Subject
  universityId: string
  sheet?: unknown
  sheetLocked?: boolean
  summary?: unknown
  summaryLocked?: boolean
  flashcards?: unknown
  flashcardsLocked?: boolean
  quizQuestions?: unknown
  quizLocked?: boolean
  previousYearQuestions?: unknown
  pyqLocked?: boolean
}

type TabId = 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'

interface Tab {
  id: TabId
  label: string
  hasContent: boolean
  locked: boolean
}

export default function LectureHub({
  lecture,
  subject,
  universityId,
  sheet,
  sheetLocked = false,
  summary,
  summaryLocked = false,
  flashcards,
  flashcardsLocked = false,
  quizQuestions,
  quizLocked = false,
  previousYearQuestions,
  pyqLocked = false,
}: LectureHubProps) {
  const tabs: Tab[] = [
    {
      id: 'sheet',
      label: 'Sheet',
      hasContent: !!sheet || sheetLocked,
      locked: sheetLocked,
    },
    {
      id: 'summary',
      label: 'Summary',
      hasContent: !!summary || summaryLocked,
      locked: summaryLocked,
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      hasContent:
        (Array.isArray(flashcards) && flashcards.length > 0) || flashcardsLocked,
      locked: flashcardsLocked,
    },
    {
      id: 'quiz',
      label: 'Quiz',
      hasContent:
        (Array.isArray(quizQuestions) && quizQuestions.length > 0) || quizLocked,
      locked: quizLocked,
    },
    {
      id: 'previous_years',
      label: 'Previous Years',
      hasContent:
        (Array.isArray(previousYearQuestions) && previousYearQuestions.length > 0) ||
        pyqLocked,
      locked: pyqLocked,
    },
  ]

  const visibleTabs = tabs.filter((t) => t.hasContent)

  const [activeTab, setActiveTab] = useState<TabId>(
    visibleTabs[0]?.id ?? 'sheet'
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Lecture header */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-1">
          {subject.name}
        </p>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {lecture.title}
        </h1>
        {lecture.description && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {lecture.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      {visibleTabs.length > 0 ? (
        <>
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
                {tab.locked && (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'sheet' && (
              sheetLocked ? (
                <LockedContentCard
                  subjectName={subject.name}
                  contentType="sheet"
                />
              ) : sheet ? (
                <SheetReader
                  content={(sheet as { content: string }).content}
                  title={(sheet as { title: string }).title}
                />
              ) : null
            )}

            {activeTab === 'summary' && (
              summaryLocked ? (
                <LockedContentCard
                  subjectName={subject.name}
                  contentType="summary"
                />
              ) : summary ? (
                <SheetReader
                  content={(summary as { content: string }).content}
                  title={(summary as { title: string }).title}
                  isSummary={true}
                />
              ) : null
            )}

            {activeTab === 'flashcards' && (
              flashcardsLocked ? (
                <LockedContentCard
                  subjectName={subject.name}
                  contentType="flashcards"
                />
              ) : flashcards ? (
                <FlashcardsViewer flashcards={flashcards as never} />
              ) : null
            )}

            {activeTab === 'quiz' && (
              quizLocked ? (
                <LockedContentCard
                  subjectName={subject.name}
                  contentType="quiz"
                />
              ) : quizQuestions ? (
                <QuizViewer questions={quizQuestions as never} />
              ) : null
            )}

            {activeTab === 'previous_years' && (
              pyqLocked ? (
                <LockedContentCard
                  subjectName={subject.name}
                  contentType="previous_years"
                />
              ) : previousYearQuestions ? (
                <PreviousYearsViewer questions={previousYearQuestions as never} />
              ) : null
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            No content available for this lecture yet.
          </p>
        </div>
      )}
    </div>
  )
}