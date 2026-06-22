'use client'

import { useState, useEffect, useRef } from 'react'
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
  sheetImageSlots?: Record<number, string>
  summaryImageSlots?: Record<number, string>
}

type TabId = 'videos' | 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'

interface Tab {
  id: TabId
  label: string
  icon: string
  hasContent: boolean
  locked: boolean
}

const TAB_ICONS: Record<TabId, string> = {
  videos: '▶',
  sheet: '📄',
  summary: '📝',
  flashcards: '🃏',
  quiz: '❓',
  previous_years: '📅',
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
  sheetImageSlots = {},
  summaryImageSlots = {},
}: LectureHubProps) {

  const tabs: Tab[] = [
    { id: 'videos', label: 'Videos', icon: TAB_ICONS.videos, hasContent: videos.length > 0, locked: false },
    { id: 'sheet', label: 'Sheet', icon: TAB_ICONS.sheet, hasContent: !!sheet || sheetLocked, locked: sheetLocked },
    { id: 'summary', label: 'Summary', icon: TAB_ICONS.summary, hasContent: !!summary || summaryLocked, locked: summaryLocked },
    { id: 'flashcards', label: 'Flashcards', icon: TAB_ICONS.flashcards, hasContent: (Array.isArray(flashcards) && flashcards.length > 0) || flashcardsLocked, locked: flashcardsLocked },
    { id: 'quiz', label: 'Quiz', icon: TAB_ICONS.quiz, hasContent: (Array.isArray(quizQuestions) && quizQuestions.length > 0) || quizLocked, locked: quizLocked },
    { id: 'previous_years', label: 'Previous Years', icon: TAB_ICONS.previous_years, hasContent: (Array.isArray(previousYearQuestions) && previousYearQuestions.length > 0) || pyqLocked, locked: pyqLocked },
  ]

  const visibleTabs = tabs.filter((t) => t.hasContent)
  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id ?? 'sheet')
  const [tocItems, setTocItems] = useState<{ id: string; text: string; level: number }[]>([])
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const noteTimer = useRef<NodeJS.Timeout | null>(null)

  // Extract TOC from sheet/summary content
  useEffect(() => {
    const content = activeTab === 'sheet'
      ? (sheet as { content: string } | null)?.content
      : activeTab === 'summary'
      ? (summary as { content: string } | null)?.content
      : null

    if (!content) { setTocItems([]); return }

    const items: { id: string; text: string; level: number }[] = []
    const lines = content.split('\n')
    lines.forEach(line => {
      const h1 = line.match(/^#\s+(.+)/)
      const h2 = line.match(/^##\s+(.+)/)
      const h3 = line.match(/^###\s+(.+)/)
      if (h1) items.push({ id: h1[1].toLowerCase().replace(/\s+/g, '-'), text: h1[1], level: 1 })
      else if (h2) items.push({ id: h2[1].toLowerCase().replace(/\s+/g, '-'), text: h2[1], level: 2 })
      else if (h3) items.push({ id: h3[1].toLowerCase().replace(/\s+/g, '-'), text: h3[1], level: 3 })
    })
    setTocItems(items)
  }, [activeTab, sheet, summary])

  // Load note
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('user_notes')
      .select('note_content')
      .eq('user_id', userId)
      .eq('lecture_id', lecture.id)
      .single()
      .then(({ data }) => {
        if (data?.note_content) setNote(data.note_content)
      })
  }, [userId, lecture.id])

  // Auto-save note
  function handleNoteChange(val: string) {
    setNote(val)
    setNoteSaved(false)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(async () => {
      if (!userId) return
      setNoteSaving(true)
      const supabase = createClient()
      await supabase.from('user_notes').upsert({
        user_id: userId,
        lecture_id: lecture.id,
        note_content: val,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id' })
      setNoteSaving(false)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    }, 1000)
  }

  // Record progress
  useEffect(() => {
    if (!userId || !lecture.id) return
    const supabase = createClient()
    async function recordProgress() {
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', userId!)
        .eq('lecture_id', lecture.id)
        .eq('content_type', activeTab)
        .single()

      if (existing) {
        await supabase.from('user_progress').update({ last_accessed_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('user_progress').insert({
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
    await supabase.from('user_progress').upsert({
      user_id: userId,
      lecture_id: lecture.id,
      content_type: activeTab,
      progress_percentage: 100,
      completed: true,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
  }

  const showSidebar = (activeTab === 'sheet' || activeTab === 'summary') && !sheetLocked && !summaryLocked

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
              {subject.name}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-snug">
              {lecture.title}
            </h1>
            {lecture.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{lecture.description}</p>
            )}
          </div>
          {userId && (
            <button
              onClick={markAsCompleted}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              ✓ Mark as Done
            </button>
          )}
        </div>

        {/* Tabs */}
        {visibleTabs.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.locked && (
                  <span className="text-amber-400 text-xs">🔒</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="border-b border-slate-200 dark:border-slate-700" />
      </div>

      {/* Content + Right Sidebar */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-auto">
          {visibleTabs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
              No content available for this lecture yet.
            </div>
          ) : (
            <>
              {activeTab === 'videos' && videos.length > 0 && <div className="p-6"><YouTubePlayer videos={videos} /></div>}
              {activeTab === 'sheet' && (sheetLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="sheet" /></div> : sheet ? <SheetReader content={(sheet as { content: string }).content} title={(sheet as { title: string }).title} userName={userName} imageSlots={sheetImageSlots} /> : null)}
              {activeTab === 'summary' && (summaryLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="summary" /></div> : summary ? <SheetReader content={(summary as { content: string }).content} title={(summary as { title: string }).title} isSummary={true} userName={userName} imageSlots={summaryImageSlots} /> : null)}
              {activeTab === 'flashcards' && (flashcardsLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="flashcards" /></div> : flashcards ? <FlashcardsViewer flashcards={flashcards as never} userName={userName} /> : null)}
              {activeTab === 'quiz' && (quizLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="quiz" /></div> : quizQuestions ? <QuizViewer questions={quizQuestions as never} userName={userName} /> : null)}
              {activeTab === 'previous_years' && (pyqLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="previous_years" /></div> : previousYearQuestions ? <PreviousYearsViewer questions={previousYearQuestions as never} userName={userName} /> : null)}
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col overflow-hidden">

          {/* Table of Contents */}
          {showSidebar && tocItems.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Contents
              </p>
              <nav className="space-y-0.5">
                {tocItems.filter(item => item.level === 1).map((item, i) => {
                  const sectionId = `section-${item.text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const el = document.getElementById(sectionId)
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="w-full text-left flex items-center gap-2.5 py-2 px-2 rounded-lg cursor-pointer transition-all group hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {i + 1}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white leading-snug font-medium">
                        {item.text}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          )}
          {showSidebar && tocItems.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Contents
              </p>
              <nav className="space-y-0.5">
                {tocItems.map((item, i) => (
                  <div
                    key={i}
                    className={`text-xs py-1.5 px-2 rounded cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug ${
                      item.level === 1 ? 'font-semibold' :
                      item.level === 2 ? 'pl-4 text-slate-500 dark:text-slate-400' :
                      'pl-6 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
              </nav>
            </div>
          )}

          {/* Personal Notes */}
          {userId && (
            <div className="flex flex-col p-4" style={{ minHeight: showSidebar && tocItems.length > 0 ? '200px' : '100%' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  My Notes
                </p>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {noteSaving ? 'Saving...' : noteSaved ? '✓ Saved' : ''}
                </span>
              </div>
              <textarea
                value={note}
                onChange={e => handleNoteChange(e.target.value)}
                placeholder="Add a personal note..."
                className="flex-1 w-full text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none leading-relaxed"
                style={{ minHeight: '120px' }}
              />
            </div>
          )}

          {/* Empty state for right sidebar */}
          {!showSidebar && !userId && (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Open a sheet to see the table of contents
              </p>
            </div>
          )}

        </aside>
      </div>
    </div>
  )
}