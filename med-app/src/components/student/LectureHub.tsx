'use client'

import { useState, useEffect } from 'react'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import YouTubePlayer from '@/components/student/YouTubePlayer'
import LockedContentCard from '@/components/student/LockedContentCard'
import { createClient } from '@/lib/supabase/client'

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

interface Video {
  id: string
  title: string
  description: string | null
  video_url: string
  is_preview: boolean
  display_order: number
}

interface LectureHubProps {
  lecture: Lecture
  subject: Subject
  universityId: string
  userName?: string
  userId?: string
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
  videos?: Video[]
}

type TabId = 'videos' | 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'

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
  userName,
  userId,
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
  videos = [],
}: LectureHubProps) {
  const tabs: Tab[] = [
    { id: 'videos', label: 'Videos', hasContent: videos.length > 0, locked: false },
    { id: 'sheet', label: 'Sheet', hasContent: !!sheet || sheetLocked, locked: sheetLocked },
    { id: 'summary', label: 'Summary', hasContent: !!summary || summaryLocked, locked: summaryLocked },
    { id: 'flashcards', label: 'Flashcards', hasContent: (Array.isArray(flashcards) && flashcards.length > 0) || flashcardsLocked, locked: flashcardsLocked },
    { id: 'quiz', label: 'Quiz', hasContent: (Array.isArray(quizQuestions) && quizQuestions.length > 0) || quizLocked, locked: quizLocked },
    { id: 'previous_years', label: 'Previous Years', hasContent: (Array.isArray(previousYearQuestions) && previousYearQuestions.length > 0) || pyqLocked, locked: pyqLocked },
  ]

  const visibleTabs = tabs.filter((t) => t.hasContent)
  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id ?? 'sheet')

  useEffect(() => {
    if (!userId || !lecture.id) return

    async function recordProgress() {
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, completed')
        .eq('user_id', userId!)
        .eq('lecture_id', lecture.id)
        .eq('content_type', activeTab)
        .single()

      if (existing) {
        await supabase
          .from('user_progress')
          .update({
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            lecture_id: lecture.id,
            content_type: activeTab,
            progress_percentage: 0,
            completed: false,
            last_accessed_at: new Date().toISOString(),
          })
      }
    }

    recordProgress()
  }, [activeTab, userId, lecture.id])

  async function markAsCompleted() {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lecture_id: lecture.id,
        content_type: activeTab,
        progress_percentage: 100,
        completed: true,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lecture_id,content_type'
      })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Lecture header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-1">{subject.name}</p>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{lecture.title}</h1>
          {lecture.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{lecture.description}</p>
          )}
        </div>
        {userId && (
          <button
            onClick={markAsCompleted}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            ✓ Mark as Done
          </button>
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
                {tab.id === 'videos' && (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
                {tab.label}
                {tab.locked && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div>
            {activeTab === 'videos' && videos.length > 0 && (
              <YouTubePlayer videos={videos} />
            )}
            {activeTab === 'sheet' && (
              sheetLocked ? <LockedContentCard subjectName={subject.name} contentType="sheet" /> :
              sheet ? <SheetReader content={(sheet as { content: string }).content} title={(sheet as { title: string }).title} userName={userName} /> : null
            )}
            {activeTab === 'summary' && (
              summaryLocked ? <LockedContentCard subjectName={subject.name} contentType="summary" /> :
              summary ? <SheetReader content={(summary as { content: string }).content} title={(summary as { title: string }).title} isSummary={true} userName={userName} /> : null
            )}
            {activeTab === 'flashcards' && (
              flashcardsLocked ? <LockedContentCard subjectName={subject.name} contentType="flashcards" /> :
              flashcards ? <FlashcardsViewer flashcards={flashcards as never} userName={userName} /> : null
            )}
            {activeTab === 'quiz' && (
              quizLocked ? <LockedContentCard subjectName={subject.name} contentType="quiz" /> :
              quizQuestions ? <QuizViewer questions={quizQuestions as never} userName={userName} /> : null
            )}
            {activeTab === 'previous_years' && (
              pyqLocked ? <LockedContentCard subjectName={subject.name} contentType="previous_years" /> :
              previousYearQuestions ? <PreviousYearsViewer questions={previousYearQuestions as never} userName={userName} /> : null
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No content available for this lecture yet.</p>
        </div>
      )}
    </div>
  )
}