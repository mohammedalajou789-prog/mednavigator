'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import LockedContentCard from '@/components/student/LockedContentCard'
import LectureContentSearch from '@/components/student/LectureContentSearch'
import { useQuery } from '@tanstack/react-query'

// ── Types ──────────────────────────────────────────────────────────────────

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
  h1Num: number
  h2Num: number | null
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
  subjectSlug?: string
  userName?: string
  userId?: string
  accessAllowed: boolean
  hasSheet: boolean
  hasSummary: boolean
  flashcardsCount: number
  quizCount: number
  pyqCount: number
  videos: Video[]
}

// ── Tab Config ─────────────────────────────────────────────────────────────

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

// ── Color constants — all from globals.css CSS variables ───────────────────

const C = {
  bg:      'var(--background)',
  card:    'var(--card)',
  border:  'var(--border)',
  ink:     'var(--foreground)',
  ink2:    'var(--muted-foreground)',
  muted:   'var(--muted)',
  primary: 'var(--primary)',
  label:   '#94A3B8',   // sidebar section headers — no CSS var exists yet
  green:   '#16A34A',
  amber:   '#D97706',
} as const

// ── TOC Extractor ──────────────────────────────────────────────────────────

export function extractToc(content: string): TocSection[] {
  const lines = content.split('\n')
  const toc: TocSection[] = []
  let h1Counter = 0
  let h2Counter = 0

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)

    if (h1) {
      h1Counter++
      h2Counter = 0
      const label = h1[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 1, label, h1Num: h1Counter, h2Num: null })
    } else if (h2) {
      h2Counter++
      const label = h2[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      if (h1Counter === 0) {
        h1Counter++
        h2Counter = 0
        toc.push({ id, level: 1, label, h1Num: h1Counter, h2Num: null })
      } else {
        toc.push({ id, level: 2, label, h1Num: h1Counter, h2Num: h2Counter })
      }
    } else if (h3) {
      const label = h3[1].trim()
      const id = `section-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      toc.push({ id, level: 3, label, h1Num: h1Counter, h2Num: h2Counter })
    }
  }
  return toc
}

// ── Content fetcher ────────────────────────────────────────────────────────
// Removed cache: 'no-store' — TanStack Query caches in memory (staleTime: 30min).
// The browser HTTP cache is now allowed to assist on navigation back.

async function fetchTabContent(lectureId: string, subjectId: string, tab: string) {
  const res = await fetch(
    `/api/lecture-content?lectureId=${lectureId}&subjectId=${subjectId}&tab=${tab}`
  )
  if (!res.ok) throw new Error('Failed to fetch content')
  return res.json()
}

// ── Resume state — sessionStorage ─────────────────────────────────────────
// The previous implementation queried a DB table 'lecture_resume_state'
// that does not exist in the 38-table schema. Every open, scroll, tab
// switch, and card flip was triggering a failing network call silently.
//
// Replacement: sessionStorage. Instant, zero network cost, session-scoped.
// The resume feature now actually works.

interface ResumeState {
  activeTab:      string
  sheetScroll:    number
  summaryScroll:  number
  flashcardIndex: number
  quizIndex:      number
  pyqIndex:       number
}

const resumeKey = (id: string) => `mn_resume:${id}`

function loadResume(lectureId: string): ResumeState | null {
  try {
    const raw = sessionStorage.getItem(resumeKey(lectureId))
    return raw ? (JSON.parse(raw) as ResumeState) : null
  } catch {
    return null
  }
}

function saveResume(lectureId: string, state: ResumeState): void {
  try {
    sessionStorage.setItem(resumeKey(lectureId), JSON.stringify(state))
  } catch {
    // Storage quota exceeded — ignore
  }
}

// ── ContentSkeleton — defined OUTSIDE LectureHub ───────────────────────────
// Previously defined inside the component: React treated it as a brand-new
// component on every render and unmounted/remounted it constantly.

function ContentSkeleton() {
  return (
    <div style={{ padding: '24px 0' }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 28 : 16,
            background: 'linear-gradient(90deg, var(--border) 25%, var(--muted) 50%, var(--border) 75%)',
            backgroundSize: '200% 100%',
            borderRadius: 8,
            marginBottom: 16,
            width: i % 3 === 2 ? '60%' : '100%',
            animation: 'mn-shimmer 1.5s infinite',
          }}
        />
      ))}
      <style>{`@keyframes mn-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
    </div>
  )
}

// ── LectureHub ─────────────────────────────────────────────────────────────

export default function LectureHub({
  lecture,
  subject,
  universityId,
  subjectSlug,
  userName,
  accessAllowed,
  hasSheet,
  hasSummary,
  flashcardsCount,
  quizCount,
  pyqCount,
}: LectureHubProps) {
  const { user }           = useUserStore()
  const supabase           = useMemo(() => createClient(), [])
  const { setSidebarOpen } = useUIStore()

  const availableTabs = [
    hasSheet            && 'sheet',
    hasSummary          && 'summary',
    flashcardsCount > 0 && 'flashcards',
    quizCount > 0       && 'quiz',
    pyqCount > 0        && 'previous_years',
  ].filter(Boolean) as string[]

  const allTabs = availableTabs.length > 0 ? availableTabs : ['sheet']

  // ── UI state ───────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSectionId,  setActiveSectionId]  = useState('')
  const [activeTab,        setActiveTab]         = useState(allTabs[0])
  const [progressPercent,  setProgressPercent]   = useState(0)
  const [isCompleted,      setIsCompleted]       = useState(false)
  const [isBookmarked,     setIsBookmarked]      = useState(false)

  // ── Card index state ───────────────────────────────────────────────────
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [currentQuizIndex,      setCurrentQuizIndex]      = useState(0)
  const [currentPyqIndex,       setCurrentPyqIndex]       = useState(0)

  // ── Stats state ────────────────────────────────────────────────────────
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({
    total: flashcardsCount, easy: 0, medium: 0, hard: 0, current: 1, important: 0,
  })
  const [quizStats, setQuizStats] = useState<QuizStats>({
    total: quizCount, answered: 0, correct: 0, current: 1, important: 0,
  })
  const [pyqStats, setPyqStats] = useState({ total: pyqCount, important: 0, answered: 0 })

  // ── Refs ───────────────────────────────────────────────────────────────
  const sheetScrollRef    = useRef(0)
  const summaryScrollRef  = useRef(0)
  const flashcardIdxRef   = useRef(0)
  const quizIdxRef        = useRef(0)
  const pyqIdxRef         = useRef(0)
  const scrollRestoredRef = useRef(false)
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedPct      = useRef(-1)
  const displayPctRef     = useRef(0)   // prevents re-render on every scroll pixel
  const prevSectionId     = useRef('')

  // ── Load resume state from sessionStorage on mount ─────────────────────
  useEffect(() => {
    const saved = loadResume(lecture.id)
    if (!saved) return

    if (saved.activeTab && allTabs.includes(saved.activeTab)) setActiveTab(saved.activeTab)
    sheetScrollRef.current    = saved.sheetScroll    ?? 0
    summaryScrollRef.current  = saved.summaryScroll  ?? 0
    flashcardIdxRef.current   = saved.flashcardIndex ?? 0
    quizIdxRef.current        = saved.quizIndex      ?? 0
    pyqIdxRef.current         = saved.pyqIndex       ?? 0

    if ((saved.flashcardIndex ?? 0) > 0) setCurrentFlashcardIndex(saved.flashcardIndex)
    if ((saved.quizIndex      ?? 0) > 0) setCurrentQuizIndex(saved.quizIndex)
    if ((saved.pyqIndex       ?? 0) > 0) setCurrentPyqIndex(saved.pyqIndex)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Close app sidebar when in lecture view ─────────────────────────────
  useEffect(() => {
    setSidebarOpen(false)
    return () => setSidebarOpen(true)
  }, [setSidebarOpen])

  // ── Shared query options ───────────────────────────────────────────────
  const qOpts = { staleTime: 1000 * 60 * 30, refetchOnWindowFocus: false, refetchOnMount: false }

  // ── Content queries (lazy — only fires when the tab is active) ─────────
  const { data: sheetPayload,      isLoading: sheetLoading      } = useQuery({
    queryKey: ['tab-content', lecture.id, subject.id, 'sheet'],
    queryFn:  () => fetchTabContent(lecture.id, subject.id, 'sheet'),
    enabled:  activeTab === 'sheet',
    ...qOpts,
  })
  const { data: summaryPayload,    isLoading: summaryLoading    } = useQuery({
    queryKey: ['tab-content', lecture.id, subject.id, 'summary'],
    queryFn:  () => fetchTabContent(lecture.id, subject.id, 'summary'),
    enabled:  activeTab === 'summary',
    ...qOpts,
  })
  const { data: flashcardsPayload, isLoading: flashcardsLoading } = useQuery({
    queryKey: ['tab-content', lecture.id, subject.id, 'flashcards'],
    queryFn:  () => fetchTabContent(lecture.id, subject.id, 'flashcards'),
    enabled:  activeTab === 'flashcards',
    ...qOpts,
  })
  const { data: quizPayload,       isLoading: quizLoading       } = useQuery({
    queryKey: ['tab-content', lecture.id, subject.id, 'quiz'],
    queryFn:  () => fetchTabContent(lecture.id, subject.id, 'quiz'),
    enabled:  activeTab === 'quiz',
    ...qOpts,
  })
  const { data: pyqPayload,        isLoading: pyqLoading        } = useQuery({
    queryKey: ['tab-content', lecture.id, subject.id, 'previous_years'],
    queryFn:  () => fetchTabContent(lecture.id, subject.id, 'previous_years'),
    enabled:  activeTab === 'previous_years',
    ...qOpts,
  })

  // ── Derived content values ─────────────────────────────────────────────
  const sheet:       Sheet | null   = sheetPayload?.data    ?? null
  const sheetLocked: boolean        = sheetPayload?.locked  ?? !accessAllowed
  const sheetImageSlots = useMemo<Record<number, string>>(() =>
    Object.fromEntries(
      Object.entries(sheetPayload?.imageSlots ?? {}).map(([k, v]) => [Number(k), String(v)])
    ),
  [sheetPayload?.imageSlots])

  const summary:       Summary | null = summaryPayload?.data   ?? null
  const summaryLocked: boolean        = summaryPayload?.locked ?? !accessAllowed
  const summaryImageSlots = useMemo<Record<number, string>>(() =>
    Object.fromEntries(
      Object.entries(summaryPayload?.imageSlots ?? {}).map(([k, v]) => [Number(k), String(v)])
    ),
  [summaryPayload?.imageSlots])

  const flashcards:            Flashcard[]             = flashcardsPayload?.data ?? []
  const flashcardsLocked:      boolean                 = flashcardsPayload?.locked ?? !accessAllowed
  const quizQuestions:         QuizQuestion[]          = quizPayload?.data ?? []
  const quizLocked:            boolean                 = quizPayload?.locked ?? !accessAllowed
  const previousYearQuestions: PreviousYearQuestion[]  = pyqPayload?.data ?? []
  const pyqLocked:             boolean                 = pyqPayload?.locked ?? !accessAllowed

  const isCurrentTabLocked =
    (activeTab === 'sheet'          && sheetLocked)     ||
    (activeTab === 'summary'        && summaryLocked)    ||
    (activeTab === 'flashcards'     && flashcardsLocked) ||
    (activeTab === 'quiz'           && quizLocked)       ||
    (activeTab === 'previous_years' && pyqLocked)

  const isCurrentTabLoading =
    (activeTab === 'sheet'          && sheetLoading)     ||
    (activeTab === 'summary'        && summaryLoading)    ||
    (activeTab === 'flashcards'     && flashcardsLoading) ||
    (activeTab === 'quiz'           && quizLoading)       ||
    (activeTab === 'previous_years' && pyqLoading)

  // ── TOC ────────────────────────────────────────────────────────────────
  const tocSections = useMemo<TocSection[]>(() => {
    if (activeTab === 'sheet')   return extractToc(sheet?.content   ?? '')
    if (activeTab === 'summary') return extractToc(summary?.content ?? '')
    return []
  }, [activeTab, sheet?.content, summary?.content])

  // ── Progress query — fetches ALL content types for this lecture once ───
  const { data: progressData } = useQuery({
    queryKey: ['progress', user?.id, lecture.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('content_type, progress_percentage, completed')
        .eq('user_id', user!.id)
        .eq('lecture_id', lecture.id)
      return data ?? []
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const currentTabProgress = useMemo(() => {
    if (!progressData) return null
    return (progressData as { content_type: string; progress_percentage: number; completed: boolean }[])
      .find(r => r.content_type === activeTab) ?? null
  }, [progressData, activeTab])

  useEffect(() => {
    displayPctRef.current = currentTabProgress?.progress_percentage ?? 0
    setProgressPercent(currentTabProgress?.progress_percentage ?? 0)
    setIsCompleted(currentTabProgress?.completed ?? false)
  }, [currentTabProgress])

  // ── Bookmark query ─────────────────────────────────────────────────────
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
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  useEffect(() => { setIsBookmarked(!!bookmarkData) }, [bookmarkData])

  // ── Scroll restoration ─────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRestoredRef.current) return
    if (activeTab !== 'sheet' && activeTab !== 'summary') return

    const target = activeTab === 'sheet' ? sheetScrollRef.current : summaryScrollRef.current
    if (target <= 0) return

    const ready = activeTab === 'sheet'
      ? (sheetPayload !== undefined && !sheetLoading)
      : (summaryPayload !== undefined && !summaryLoading)
    if (!ready) return

    scrollRestoredRef.current = true
    setTimeout(() => {
      document.getElementById('lecture-content-scroll')
        ?.scrollTo({ top: target, behavior: 'smooth' })
    }, 400)
  }, [activeTab, sheetPayload, summaryPayload, sheetLoading, summaryLoading])

  // ── TOC scroll tracking ────────────────────────────────────────────────
  useEffect(() => {
    if (tocSections.length === 0) return
    const scrollEl = document.getElementById('lecture-content-scroll')
    if (!scrollEl) return

    function onScroll() {
      let current = tocSections[0]?.id ?? ''
      for (const s of tocSections) {
        const el = document.getElementById(s.id)
        if (!el) continue
        if (el.getBoundingClientRect().top - scrollEl!.getBoundingClientRect().top <= 140) {
          current = s.id
        }
      }
      setActiveSectionId(current)
      if (current !== prevSectionId.current) {
        prevSectionId.current = current
        document.getElementById(`toc-btn-${current}`)
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [tocSections])

  // ── Helpers ────────────────────────────────────────────────────────────

  function buildResume(overrides: Partial<ResumeState> = {}): ResumeState {
    return {
      activeTab,
      sheetScroll:    sheetScrollRef.current,
      summaryScroll:  summaryScrollRef.current,
      flashcardIndex: currentFlashcardIndex,
      quizIndex:      currentQuizIndex,
      pyqIndex:       currentPyqIndex,
      ...overrides,
    }
  }

  function handleTocClick(id: string) {
    const el      = document.getElementById(id)
    const scrollEl = document.getElementById('lecture-content-scroll')
    if (!el || !scrollEl) return
    const offset = el.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - 96
    scrollEl.scrollTo({ top: offset, behavior: 'smooth' })
  }

  function handleProgressUpdate(pct: number) {
    // Only re-render when the displayed number would actually change
    if (Math.abs(pct - displayPctRef.current) >= 1) {
      displayPctRef.current = pct
      setProgressPercent(pct)
    }

    if (!user) return
    if (Math.abs(pct - lastSavedPct.current) < 3) return
    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current)

    progressSaveTimer.current = setTimeout(() => {
      lastSavedPct.current = pct
      const scrollPos = document.getElementById('lecture-content-scroll')?.scrollTop ?? 0

      if (activeTab === 'sheet')   sheetScrollRef.current   = scrollPos
      if (activeTab === 'summary') summaryScrollRef.current = scrollPos

      supabase.from('user_progress').upsert({
        user_id:             user.id,
        lecture_id:          lecture.id,
        content_type:        activeTab,
        progress_percentage: pct,
        completed:           pct >= 100,
        last_accessed_at:    new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })

      saveResume(lecture.id, buildResume({
        sheetScroll:   sheetScrollRef.current,
        summaryScroll: summaryScrollRef.current,
      }))
    }, 3000)
  }

  async function handleMarkComplete() {
    if (!user) return
    const next = !isCompleted
    setIsCompleted(next)
    setProgressPercent(next ? 100 : progressPercent)
    await supabase.from('user_progress').upsert({
      user_id:             user.id,
      lecture_id:          lecture.id,
      content_type:        activeTab,
      progress_percentage: next ? 100 : progressPercent,
      completed:           next,
      last_accessed_at:    new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
  }

  async function handleToggleBookmark() {
    if (!user) return
    if (isBookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id)
        .eq('lecture_id', lecture.id)
        .eq('bookmark_type', 'lecture')
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks')
        .insert({ user_id: user.id, lecture_id: lecture.id, bookmark_type: 'lecture' })
      setIsBookmarked(true)
    }
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    scrollRestoredRef.current = false
    saveResume(lecture.id, buildResume({ activeTab: tab }))
  }

  function handleFlashcardIndexChange(index: number) {
    setCurrentFlashcardIndex(index)
    flashcardIdxRef.current = index
    saveResume(lecture.id, buildResume({ flashcardIndex: index }))
  }

  function handleQuizIndexChange(index: number) {
    setCurrentQuizIndex(index)
    quizIdxRef.current = index
    saveResume(lecture.id, buildResume({ quizIndex: index }))
  }

  function handlePyqIndexChange(index: number) {
    setCurrentPyqIndex(index)
    pyqIdxRef.current = index
    saveResume(lecture.id, buildResume({ pyqIndex: index }))
  }

  const displayName = userName ?? user?.full_name ?? ''

  // ── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div className="flex" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

      {/* ── CENTER: scrollable content ── */}
      <div
        id="lecture-content-scroll"
        className="flex-1 min-w-0"
        style={{ overflowY: 'auto', height: 'calc(100vh - 72px)', background: C.bg }}
      >
        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-1 px-4 pt-3 pb-2 overflow-x-auto"
          style={{ flexShrink: 0, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          {allTabs.map((tabId) => {
            const cfg = TAB_CONFIG[tabId]
            const isActive = activeTab === tabId
            return (
              <button key={tabId} onClick={() => handleTabChange(tabId)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 500, background: isActive ? '#EEF3FF' : C.muted, color: isActive ? C.primary : C.ink2, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {cfg.icon}{cfg.label}
              </button>
            )
          })}
        </div>

        {/* Hero */}
        <div style={{ padding: 'clamp(8px,2vw,14px) clamp(12px,3vw,26px) 0', background: C.bg }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: C.ink2, fontWeight: 500, marginBottom: 18 }}>
            <svg style={{ color: C.label }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <Link href={`/${universityId}`} style={{ color: 'inherit', textDecoration: 'none' }}>Subjects</Link>
            <span style={{ color: C.border }}>/</span>
            <Link href={`/${universityId}/${subjectSlug ?? subject.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{subject.name}</Link>
            <span style={{ color: C.border }}>/</span>
            <span style={{ color: C.ink, fontWeight: 700 }}>{lecture.title}</span>
          </div>

          {/* Lecture card */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '22px 26px', marginBottom: 16, background: 'linear-gradient(120deg,rgb(237,243,255) 0%,rgb(243,247,255) 52%,rgb(252,253,255) 100%)', border: '1px solid rgb(226,234,251)', boxShadow: 'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.4) 0px 20px 42px -30px' }}>
            <div style={{ position: 'absolute', top: -40, right: 70, width: 230, height: 130, background: 'radial-gradient(rgba(147,197,253,0.34) 0%,rgba(196,181,253,0.13) 55%,transparent 75%)', filter: 'blur(28px)', pointerEvents: 'none' }} />

            {/* Badges desktop */}
            <div className="hidden sm:flex" style={{ position: 'absolute', top: 24, right: 28, flexDirection: 'column', alignItems: 'flex-end', gap: 9 }}>
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: '#E7F7EF', border: '1px solid #C7EBD8', color: C.green, fontSize: 12.5, fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Completed
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: '#EFF4FF', border: '1px solid #D5E2FF', color: C.primary, fontSize: 12.5, fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  In Progress
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: 12.5, fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={C.amber} stroke={C.amber} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>

            {/* Badges mobile */}
            <div className="flex sm:hidden gap-2 mb-3 flex-wrap">
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#E7F7EF', border: '1px solid #C7EBD8', color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Completed</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#EFF4FF', border: '1px solid #D5E2FF', color: C.primary, fontSize: 11, fontWeight: 700 }}>In Progress</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: 11, fontWeight: 700 }}>
                ★ {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>

            {/* Title */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(150deg,rgb(59,121,255),rgb(47,107,255))', color: '#fff', flexShrink: 0, boxShadow: '0 10px 22px -8px rgba(47,107,255,.7)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
              </span>
              <div style={{ paddingTop: 2, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(22px,3vw,30px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.025em', color: 'rgb(21,32,58)' }}>{lecture.title}</h1>
                <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: C.primary }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />
                  {subject.name}
                </div>
              </div>
            </div>

            {lecture.description && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(47,107,255,0.06)', borderRadius: 12, borderLeft: `3px solid ${C.primary}` }}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#3C4661' }}>{lecture.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '0 clamp(12px,3vw,26px) 24px' }}>
          {isCurrentTabLocked ? (
            <LockedContentCard subjectName={subject.name} />
          ) : isCurrentTabLoading ? (
            <ContentSkeleton />
          ) : (
            <>
              {activeTab === 'sheet' && sheet && (
                <SheetReader
                  content={sheet.content ?? ''}
                  title={lecture.title}
                  onProgressUpdate={handleProgressUpdate}
                  userName={displayName}
                  tocSections={tocSections}
                  imageSlots={sheetImageSlots}
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
                  imageSlots={summaryImageSlots}
                />
              )}
              {activeTab === 'flashcards' && flashcards.length > 0 && (
                <FlashcardsViewer
                  flashcards={flashcards as any}
                  userName={displayName}
                  initialIndex={currentFlashcardIndex}
                  onIndexChange={handleFlashcardIndexChange}
                  onStatsChange={setFlashcardStats}
                />
              )}
              {activeTab === 'quiz' && quizQuestions.length > 0 && (
                <QuizViewer
                  questions={quizQuestions as any}
                  lectureId={lecture.id}
                  userName={displayName}
                  initialIndex={currentQuizIndex}
                  onIndexChange={handleQuizIndexChange}
                  onStatsChange={setQuizStats}
                />
              )}
              {activeTab === 'previous_years' && previousYearQuestions.length > 0 && (
                <PreviousYearsViewer
                  questions={previousYearQuestions as any}
                  userName={displayName}
                  initialIndex={currentPyqIndex}
                  onIndexChange={handlePyqIndexChange}
                  onStatsChange={setPyqStats}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <aside
        id="lecture-right-sidebar"
        className="hidden lg:flex"
        style={{ width: sidebarCollapsed ? 64 : 272, height: 'calc(100vh - 72px)', overflowY: 'auto', borderLeft: `1px solid ${C.border}`, background: C.muted, flexDirection: 'column', gap: 12, padding: sidebarCollapsed ? '16px 8px' : '16px 12px', flexShrink: 0, transition: 'width 0.25s ease, padding 0.25s ease' }}
      >
        {/* Collapse toggle */}
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, cursor: 'pointer', color: C.ink2, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarCollapsed ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
          </svg>
        </button>

        {/* Content Tabs */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: sidebarCollapsed ? 8 : '14px 16px 10px' }}>
            {!sidebarCollapsed && (
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Content</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...(sidebarCollapsed && { maxHeight: 300, overflowY: 'auto', scrollbarWidth: 'none' }) }}>
              {allTabs.map((tabId) => {
                const cfg = TAB_CONFIG[tabId]
                const isActive = activeTab === tabId
                return (
                  <button key={tabId} onClick={() => handleTabChange(tabId)} title={cfg.label}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: sidebarCollapsed ? 10 : '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isActive ? '#EEF3FF' : 'transparent', color: isActive ? C.primary : C.ink2, transition: 'all 0.15s ease', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: isActive ? '#DBEAFE' : C.muted, color: isActive ? C.primary : C.label, flexShrink: 0, transition: 'all 0.15s ease' }}>
                        {cfg.icon}
                      </span>
                      {!sidebarCollapsed && <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500 }}>{cfg.label}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? C.primary : C.border} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Reading Progress */}
        {!!user && (activeTab === 'sheet' || activeTab === 'summary') && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.border} strokeWidth="5"/>
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.primary} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={138.23 - (138.23 * progressPercent / 100)} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.primary }}>{progressPercent}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.label, letterSpacing: '0.04em' }}>READ</span>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reading Progress</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke={C.border} strokeWidth="5"/>
                      <circle cx="28" cy="28" r="22" fill="none" stroke={C.primary} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={138.23 - (138.23 * progressPercent / 100)} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{progressPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>{progressPercent >= 100 ? 'Finished!' : 'Keep reading'}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: C.ink2, fontWeight: 500 }}>{progressPercent >= 100 ? 'Great job!' : progressPercent > 0 ? `${progressPercent}% done` : 'Not started'}</p>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: C.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 999, background: 'linear-gradient(90deg,#3B82F6,#2563EB)', transition: 'width 0.3s ease' }} />
                </div>
                <button onClick={handleMarkComplete}
                  style={{ marginTop: 12, width: '100%', padding: 8, borderRadius: 9, border: `1px solid ${C.border}`, background: isCompleted ? '#E7F7EF' : C.card, color: isCompleted ? C.green : C.ink2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Flashcard Stats */}
        {activeTab === 'flashcards' && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.border} strokeWidth="5"/>
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.primary} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={flashcardStats.total > 0 ? 138.23 - (138.23 * (flashcardStats.current - 1) / flashcardStats.total) : 138.23} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.primary }}>{flashcardStats.current}/{flashcardStats.total}</span>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.label, letterSpacing: '0.04em' }}>CARDS</span>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <StatPill label="Total"     value={flashcardStats.total}     color="blue"  />
                  <StatPill label="Important" value={flashcardStats.important} color="amber" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Quiz Stats */}
        {activeTab === 'quiz' && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.border} strokeWidth="5"/>
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={quizStats.total > 0 ? 138.23 - (138.23 * quizStats.correct / quizStats.total) : 138.23} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.green }}>{quizStats.answered > 0 ? Math.round(quizStats.correct / quizStats.answered * 100) : 0}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.label, letterSpacing: '0.04em' }}>SCORE</span>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quiz Progress</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <StatPill label="Total"     value={quizStats.total}     color="blue"  />
                  <StatPill label="Correct"   value={quizStats.correct}   color="green" />
                  <StatPill label="Answered"  value={quizStats.answered}  color="slate" />
                  <StatPill label="Important" value={quizStats.important} color="amber" />
                </div>
              </>
            )}
          </div>
        )}

        {/* PYQ Stats */}
        {activeTab === 'previous_years' && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  <svg width="44" height="44" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.border} strokeWidth="5"/>
                    <circle cx="28" cy="28" r="22" fill="none" stroke={C.amber} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={pyqStats.total > 0 ? 138.23 - (138.23 * pyqStats.answered / pyqStats.total) : 138.23} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.amber }}>{pyqStats.answered}/{pyqStats.total}</span>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.label, letterSpacing: '0.04em' }}>PYQ</span>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Previous Years</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <StatPill label="Total"     value={pyqStats.total}     color="blue"  />
                  <StatPill label="Important" value={pyqStats.important} color="amber" />
                  <StatPill label="Answered"  value={pyqStats.answered}  color="green" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Content Search */}
        {!sidebarCollapsed && (activeTab === 'sheet' || activeTab === 'summary') && (
          <LectureContentSearch
            sheetContent={sheet?.content ?? ''}
            summaryContent={summary?.content ?? ''}
            activeTab={activeTab}
          />
        )}

        {/* Table of Contents */}
        {tocSections.length > 0 && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: sidebarCollapsed ? '10px 6px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sidebarCollapsed ? (
              <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', scrollbarWidth: 'none' }}>
                {tocSections.filter(s => s.level <= 2).map((section) => {
                  const isMain = section.level === 1
                  const label  = isMain ? `${section.h1Num}` : `${section.h1Num}${String.fromCharCode(96 + section.h2Num!)}`
                  return (
                    <button key={section.id} id={`toc-btn-${section.id}`} onClick={() => handleTocClick(section.id)} title={section.label}
                      style={{ width: 32, height: 20, borderRadius: 6, border: 'none', background: activeSectionId === section.id ? C.primary : isMain ? '#EEF3FF' : 'transparent', color: activeSectionId === section.id ? '#fff' : isMain ? C.primary : C.label, fontSize: 10, fontWeight: isMain ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, color 0.2s' }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Table of Contents</p>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflowY: 'auto' }}>
                  {tocSections.filter(s => s.level <= 3).map((section) => {
                    let numLabel = ''
                    if (section.level === 1) numLabel = `${section.h1Num}`
                    else if (section.level === 2) {
                      const letter = String.fromCharCode(96 + section.h2Num!)
                      numLabel = section.h1Num > 0 ? `${section.h1Num}${letter}` : `${section.h2Num}`
                    } else {
                      numLabel = '·'
                    }
                    const isMain = section.level === 1
                    return (
                      <button key={section.id} onClick={() => handleTocClick(section.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: isMain ? '9px 10px' : '6px 10px 6px 18px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ minWidth: 26, height: 26, borderRadius: '50%', background: isMain ? C.primary : '#EEF3FF', color: isMain ? '#fff' : C.primary, fontSize: isMain ? 11 : 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 4px' }}>
                          {numLabel}
                        </span>
                        <span style={{ fontSize: isMain ? 13 : 12, fontWeight: isMain ? 700 : 500, color: isMain ? C.ink : C.ink2, lineHeight: 1.4 }}>
                          {section.label}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </>
            )}
          </div>
        )}

        {/* Notes — supabase instance passed as prop (no new client per render) */}
        {!sidebarCollapsed && <NotesPanel lectureId={lecture.id} supabaseClient={supabase} />}

        {/* Actions */}
        {!sidebarCollapsed && !!user && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleToggleBookmark}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: isBookmarked ? '#FFF7ED' : C.card, color: isBookmarked ? C.amber : C.ink2, transition: 'all 0.15s ease' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? C.amber : 'none'} stroke={isBookmarked ? C.amber : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <Link
                href={`/${universityId}/${subjectSlug ?? subject.id}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 500, color: C.ink2, background: C.card, textDecoration: 'none', transition: 'all 0.15s ease' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Subject
              </Link>
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </aside>
    </div>
  )
}

// ── StatPill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'amber' | 'slate' }) {
  const bg   = color === 'blue' ? '#EFF6FF' : color === 'green' ? '#F0FDF4' : color === 'amber' ? '#FFFBEB' : '#F8FAFC'
  const text = color === 'blue' ? '#2563EB' : color === 'green' ? '#16A34A' : color === 'amber' ? '#D97706' : '#64748B'
  const sub  = color === 'blue' ? '#3B82F6' : color === 'green' ? '#22C55E' : color === 'amber' ? '#F59E0B' : '#94A3B8'
  return (
    <div style={{ background: bg, borderRadius: 10, padding: 10, textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: text }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
    </div>
  )
}

// ── NotesPanel ──────────────────────────────────────────────────────────────
// Receives the supabase client as a prop instead of creating a new one.

interface NotesPanelProps {
  lectureId:      string
  supabaseClient: ReturnType<typeof createClient>
}

function NotesPanel({ lectureId, supabaseClient }: NotesPanelProps) {
  const { user } = useUserStore()
  const [note, setNote]       = useState('')
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)
  const [noteId, setNoteId]   = useState<string | null>(null)
  const saveTimer             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabaseClient
      .from('user_notes')
      .select('id, note_content')
      .eq('user_id', user.id)
      .eq('lecture_id', lectureId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setNote(data.note_content ?? ''); setNoteId(data.id) }
        setLoading(false)
      })
  }, [user, lectureId, supabaseClient])

  function handleChange(val: string) {
    setNote(val)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(val), 1500)
  }

  async function saveNote(content: string) {
    if (!user) return
    if (noteId) {
      await supabaseClient
        .from('user_notes')
        .update({ note_content: content, updated_at: new Date().toISOString() })
        .eq('id', noteId)
    } else {
      const { data } = await supabaseClient
        .from('user_notes')
        .insert({ user_id: user.id, lecture_id: lectureId, note_content: content })
        .select('id')
        .maybeSingle()
      if (data) setNoteId(data.id)
    }
    setSaved(true)
  }

  if (!user) return null

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: '0.06em', textTransform: 'uppercase' }}>My Notes</p>
        {saved            && <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>✓ Saved</span>}
        {!saved && note.length > 0 && <span style={{ fontSize: 10, color: C.ink2 }}>Saving...</span>}
      </div>
      {loading ? (
        <div style={{ height: 80, background: C.muted, borderRadius: 10 }} />
      ) : (
        <textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your notes here..."
          rows={4}
          style={{ width: '100%', fontSize: 12.5, color: C.ink, background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 10, padding: 10, resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      )}
    </div>
  )
}