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

interface TocItem {
  id: string
  text: string
  level: number
  index: number
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

  const allTabs = [
    { id: 'videos' as TabId, label: 'Videos', hasContent: videos.length > 0, locked: false },
    { id: 'sheet' as TabId, label: 'Sheet', hasContent: !!sheet || sheetLocked, locked: sheetLocked },
    { id: 'summary' as TabId, label: 'Summary', hasContent: !!summary || summaryLocked, locked: summaryLocked },
    { id: 'flashcards' as TabId, label: 'Flashcards', hasContent: (Array.isArray(flashcards) && flashcards.length > 0) || flashcardsLocked, locked: flashcardsLocked },
    { id: 'quiz' as TabId, label: 'Quiz', hasContent: (Array.isArray(quizQuestions) && quizQuestions.length > 0) || quizLocked, locked: quizLocked },
    { id: 'previous_years' as TabId, label: 'Prev. Years', hasContent: (Array.isArray(previousYearQuestions) && previousYearQuestions.length > 0) || pyqLocked, locked: pyqLocked },
  ]

  const visibleTabs = allTabs.filter(t => t.hasContent)
  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id ?? 'sheet')
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeTocId, setActiveTocId] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [completed, setCompleted] = useState(false)
  const noteTimer = useRef<NodeJS.Timeout | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Extract TOC
  useEffect(() => {
    const content = activeTab === 'sheet'
      ? (sheet as { content: string } | null)?.content
      : activeTab === 'summary'
      ? (summary as { content: string } | null)?.content
      : null

    if (!content) { setTocItems([]); return }

    const items: TocItem[] = []
    let h2Index = 0
    content.split('\n').forEach(line => {
      const h2 = line.match(/^##\s+(.+)/)
      const h3 = line.match(/^###\s+(.+)/)
      if (h2) {
        h2Index++
        items.push({
          id: `section-${h2[1].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
          text: h2[1],
          level: 2,
          index: h2Index
        })
      } else if (h3) {
        items.push({
          id: `section-${h3[1].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
          text: h3[1],
          level: 3,
          index: 0
        })
      }
    })
    setTocItems(items)
    if (items.length > 0) setActiveTocId(items[0].id)
  }, [activeTab, sheet, summary])

  // Load note + bookmark + progress
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase.from('user_notes').select('note_content').eq('user_id', userId).eq('lecture_id', lecture.id).single()
      .then(({ data }) => { if (data?.note_content) setNote(data.note_content) })
    supabase.from('bookmarks').select('id').eq('user_id', userId).eq('lecture_id', lecture.id).eq('bookmark_type', 'lecture').single()
      .then(({ data }) => { setBookmarked(!!data) })
    supabase.from('user_progress').select('progress_percentage, completed').eq('user_id', userId).eq('lecture_id', lecture.id).eq('content_type', activeTab).single()
      .then(({ data }) => {
        if (data) {
          setProgress(data.progress_percentage ?? 0)
          setCompleted(data.completed ?? false)
        }
      })
  }, [userId, lecture.id, activeTab])

  // Record progress on tab change
  useEffect(() => {
    if (!userId || !lecture.id) return
    const supabase = createClient()
    async function recordProgress() {
      const { data: existing } = await supabase.from('user_progress').select('id').eq('user_id', userId!).eq('lecture_id', lecture.id).eq('content_type', activeTab).single()
      if (existing) {
        await supabase.from('user_progress').update({ last_accessed_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('user_progress').insert({ user_id: userId, lecture_id: lecture.id, content_type: activeTab, progress_percentage: 0, completed: false, last_accessed_at: new Date().toISOString() })
      }
    }
    recordProgress()
  }, [activeTab, userId, lecture.id])

  function handleNoteChange(val: string) {
    setNote(val)
    setNoteSaved(false)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(async () => {
      if (!userId) return
      setNoteSaving(true)
      const supabase = createClient()
      await supabase.from('user_notes').upsert({ user_id: userId, lecture_id: lecture.id, note_content: val, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lecture_id' })
      setNoteSaving(false)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    }, 1000)
  }

  async function handleMarkCompleted() {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('user_progress').upsert({ user_id: userId, lecture_id: lecture.id, content_type: activeTab, progress_percentage: 100, completed: true, last_accessed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id,lecture_id,content_type' })
    setCompleted(true)
    setProgress(100)
  }

  async function handleBookmark() {
    if (!userId) return
    const supabase = createClient()
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', userId).eq('lecture_id', lecture.id).eq('bookmark_type', 'lecture')
      setBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: userId, lecture_id: lecture.id, bookmark_type: 'lecture' })
      setBookmarked(true)
    }
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveTocId(id)
    }
  }

  const showRightSidebar = true
  const h2Items = tocItems.filter(t => t.level === 2)

  // Circular progress SVG
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>

      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 pt-5 pb-0 flex-shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-3">
          <span>{subject.name}</span>
          <span>›</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">{lecture.title}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          {lecture.title}
        </h1>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label}
              {tab.locked && <span className="text-amber-400 text-xs">🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-auto bg-[#F8FAFC] dark:bg-slate-950">
          {visibleTabs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No content available yet.</div>
          ) : (
            <>
              {activeTab === 'videos' && <div className="p-6"><YouTubePlayer videos={videos} /></div>}
              {activeTab === 'sheet' && (sheetLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="sheet" /></div> : sheet ? <SheetReader content={(sheet as any).content} title={(sheet as any).title} userName={userName} imageSlots={sheetImageSlots} /> : null)}
              {activeTab === 'summary' && (summaryLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="summary" /></div> : summary ? <SheetReader content={(summary as any).content} title={(summary as any).title} isSummary={true} userName={userName} imageSlots={summaryImageSlots} /> : null)}
              {activeTab === 'flashcards' && (flashcardsLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="flashcards" /></div> : flashcards ? <FlashcardsViewer flashcards={flashcards as never} userName={userName} /> : null)}
              {activeTab === 'quiz' && (quizLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="quiz" /></div> : quizQuestions ? <QuizViewer questions={quizQuestions as never} userName={userName} /> : null)}
              {activeTab === 'previous_years' && (pyqLocked ? <div className="p-6"><LockedContentCard subjectName={subject.name} contentType="previous_years" /></div> : previousYearQuestions ? <PreviousYearsViewer questions={previousYearQuestions as never} userName={userName} /> : null)}
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto flex flex-col gap-0">

          {/* Progress Card */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Your Progress</p>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="6" className="dark:stroke-slate-700" />
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="#2563EB" strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{progress}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {completed ? 'Completed!' : progress > 0 ? 'Keep going!' : 'Not started'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {completed ? 'Great work' : 'Reading progress'}
                </p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          {h2Items.length > 0 && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Table of Contents</p>
              <nav className="space-y-0.5">
                {h2Items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg transition-all group ${
                      activeTocId === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                      activeTocId === item.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                      {item.index}
                    </span>
                    <span className={`text-xs leading-snug font-medium transition-colors ${
                      activeTocId === item.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* My Notes */}
          {userId && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">My Notes</p>
                <span className={`text-[10px] font-medium transition-opacity ${noteSaving || noteSaved ? 'opacity-100' : 'opacity-0'} ${noteSaved ? 'text-green-500' : 'text-slate-400'}`}>
                  {noteSaving ? 'Saving...' : '✓ Saved'}
                </span>
              </div>
              <textarea
                value={note}
                onChange={e => handleNoteChange(e.target.value)}
                placeholder="Write your notes here..."
                className="w-full text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:border-blue-400 resize-none leading-relaxed"
                rows={4}
              />
            </div>
          )}

          {/* Learning Tools */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Learning Tools</p>
            <div className="grid grid-cols-4 gap-2">
              {visibleTabs.filter(t => t.id !== 'videos').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base">
                    {tab.id === 'sheet' ? '📄' : tab.id === 'summary' ? '📝' : tab.id === 'flashcards' ? '🃏' : tab.id === 'quiz' ? '❓' : '📅'}
                  </span>
                  <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Actions</p>
            <div className="space-y-2">
              <button
                onClick={handleMarkCompleted}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  completed
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {completed ? '✓ Completed' : '✓ Mark as Completed'}
              </button>
              {userId && (
                <button
                  onClick={handleBookmark}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    bookmarked
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
                </button>
              )}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}