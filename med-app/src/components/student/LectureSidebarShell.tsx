'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import LectureContentSearch from '@/components/student/LectureContentSearch'

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

export interface PyqStats {
  total: number
  important: number
  answered: number
}

interface LectureSidebarShellProps {
  allTabs: string[]
  uniSlug: string
  subjectSlug: string
  lectureSlug: string
  lecture: Lecture
  subject: Subject
  userId: string | null
  userName: string | null
  accessAllowed: boolean
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
  'previous-years': {
    label: 'Previous Years',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
}

// ── Stat Pill ──────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'amber' | 'slate' }) {
  const bg   = color === 'blue' ? '#EFF6FF' : color === 'green' ? '#F0FDF4' : color === 'amber' ? '#FFFBEB' : '#F8FAFC'
  const text = color === 'blue' ? '#2563EB' : color === 'green' ? '#16A34A' : color === 'amber' ? '#D97706' : '#64748B'
  const sub  = color === 'blue' ? '#3B82F6' : color === 'green' ? '#22C55E' : color === 'amber' ? '#F59E0B' : '#94A3B8'
  return (
    <div style={{ background: bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: text }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
    </div>
  )
}

// ── Notes Panel ────────────────────────────────────────────────────────────

function NotesPanel({ lectureId }: { lectureId: string }) {
  const { user }   = useUserStore()
  const supabase   = createClient()
  const [note, setNote]       = useState('')
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)
  const [noteId, setNoteId]   = useState<string | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('user_notes').select('id, note_content')
        .eq('user_id', user!.id).eq('lecture_id', lectureId).maybeSingle()
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
      await supabase.from('user_notes').update({ note_content: content, updated_at: new Date().toISOString() }).eq('id', noteId)
    } else {
      const { data } = await supabase.from('user_notes').insert({ user_id: user.id, lecture_id: lectureId, note_content: content }).select('id').maybeSingle()
      if (data) setNoteId(data.id)
    }
    setSaved(true)
  }

  if (!user) return null

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>My Notes</p>
        {saved && <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 600 }}>✓ Saved</span>}
        {!saved && note.length > 0 && <span style={{ fontSize: '10px', color: '#94A3B8' }}>Saving...</span>}
      </div>
      {loading ? (
        <div style={{ height: '80px', background: '#F1F5F9', borderRadius: '10px' }} />
      ) : (
        <textarea value={note} onChange={(e) => handleChange(e.target.value)} placeholder="Write your notes here..." rows={4}
          style={{ width: '100%', fontSize: '12.5px', color: '#374151', background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px', resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      )}
    </div>
  )
}

// ── Main Sidebar Shell ─────────────────────────────────────────────────────

export default function LectureSidebarShell({
  allTabs,
  uniSlug,
  subjectSlug,
  lectureSlug,
  lecture,
  subject,
  userId,
  userName,
  accessAllowed,
}: LectureSidebarShellProps) {
  const { user } = useUserStore()
  const supabase = createClient()
  const pathname = usePathname()
  const router   = useRouter()

  const activeTab = allTabs.find(tab => pathname.endsWith('/' + tab)) ?? allTabs[0] ?? 'sheet'

  // Desktop: collapsed/expanded. Tablet: drawer open/closed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [drawerOpen,        setDrawerOpen]       = useState(false)
  const [isTablet,          setIsTablet]         = useState(false)

  // Detect screen size
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      setIsTablet(w >= 768 && w < 1280)
      setSidebarCollapsed(w < 1280)
      if (w >= 1280) setDrawerOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Swipe from right edge to open drawer on tablet
  useEffect(() => {
    if (!isTablet) return
    let startX = 0
    function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX }
    function onTouchEnd(e: TouchEvent) {
      const dx  = e.changedTouches[0].clientX - startX
      const w   = window.innerWidth
      if (dx < -50 && startX > w - 40 && !drawerOpen) setDrawerOpen(true)
      if (dx > 50 && drawerOpen) setDrawerOpen(false)
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend',   onTouchEnd)
    }
  }, [isTablet, drawerOpen])

  const [isBookmarked,    setIsBookmarked]    = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [isCompleted,     setIsCompleted]     = useState(false)
  const [tocSections,     setTocSections]     = useState<TocSection[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>('')
  const [flashcardStats,  setFlashcardStats]  = useState<FlashcardStats>({ total: 0, easy: 0, medium: 0, hard: 0, current: 1, important: 0 })
  const [quizStats,       setQuizStats]       = useState<QuizStats>({ total: 0, answered: 0, correct: 0, current: 1, important: 0 })
  const [pyqStats,        setPyqStats]        = useState<PyqStats>({ total: 0, important: 0, answered: 0 })
  const [sheetContent,    setSheetContent]    = useState('')
  const [summaryContent,  setSummaryContent]  = useState('')

  const prevSectionId = useRef<string>('')

  useEffect(() => {
    function handleSidebarEvent(e: CustomEvent) {
      const { type, data } = e.detail
      if (type === 'progress')       { setProgressPercent(data.percent); setIsCompleted(data.completed) }
      if (type === 'toc')            { setTocSections(data.sections) }
      if (type === 'flashcardStats') { setFlashcardStats(data) }
      if (type === 'quizStats')      { setQuizStats(data) }
      if (type === 'pyqStats')       { setPyqStats(data) }
      if (type === 'sheetContent')   { setSheetContent(data.content) }
      if (type === 'summaryContent') { setSummaryContent(data.content) }
    }
    window.addEventListener('lecture-sidebar-update', handleSidebarEvent as EventListener)
    return () => window.removeEventListener('lecture-sidebar-update', handleSidebarEvent as EventListener)
  }, [])

  useEffect(() => {
    setTocSections([])
    setActiveSectionId('')
    setProgressPercent(0)
    setIsCompleted(false)
    prevSectionId.current = ''
  }, [activeTab])

  useEffect(() => {
    if (tocSections.length === 0) return
    const scrollContainer = document.getElementById('lecture-content-scroll')
    if (!scrollContainer) return
    function handleScroll() {
      let current = tocSections[0]?.id ?? ''
      for (const section of tocSections) {
        const el = document.getElementById(section.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top - scrollContainer!.getBoundingClientRect().top
        if (top <= 140) current = section.id
      }
      setActiveSectionId(current)
      if (current !== prevSectionId.current) {
        prevSectionId.current = current
        const activeBtn = document.getElementById(`toc-btn-${current}`)
        if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [tocSections])

  function handleTocClick(id: string) {
    const el = document.getElementById(id)
    const scrollContainer = document.getElementById('lecture-content-scroll')
    if (!el || !scrollContainer) return
    const elRect        = el.getBoundingClientRect()
    const containerRect = scrollContainer.getBoundingClientRect()
    const offset        = elRect.top - containerRect.top + scrollContainer.scrollTop - 96
    scrollContainer.scrollTo({ top: offset, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!user) return
    supabase.from('bookmarks').select('id')
      .eq('user_id', user.id).eq('lecture_id', lecture.id).eq('bookmark_type', 'lecture')
      .maybeSingle().then(({ data }) => setIsBookmarked(!!data))
  }, [user, lecture.id])

  async function handleToggleBookmark() {
    if (!user) return
    if (isBookmarked) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id).eq('lecture_id', lecture.id).eq('bookmark_type', 'lecture')
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, lecture_id: lecture.id, bookmark_type: 'lecture' })
      setIsBookmarked(true)
    }
  }

  // ── Shared sidebar content ─────────────────────────────────────────────────
  const collapsed = isTablet ? false : sidebarCollapsed

  const sidebarContent = (
    <>
      {/* Collapse button — desktop only */}
      {!isTablet && (
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 36, borderRadius: 10, border: '1px solid #EAEDF2', background: '#fff', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
          </svg>
        </button>
      )}

      {/* Content Tabs */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: collapsed ? '8px' : '14px 16px 10px' }}>
          {!collapsed && (
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Content</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', ...(collapsed && { maxHeight: '300px', overflowY: 'auto', scrollbarWidth: 'none' }) }}>
            {allTabs.map((tabId) => {
              const cfg      = TAB_CONFIG[tabId]
              const isActive = activeTab === tabId
              const href     = `/${uniSlug}/${subjectSlug}/${lectureSlug}/${tabId}`
              return (
                <button key={tabId} title={cfg?.label ?? tabId}
                  onClick={() => {
                    localStorage.setItem(`lecture:${lecture.id}:active_tab`, tabId)
                    router.replace(href)
                    if (isTablet) setDrawerOpen(false)
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '10px' : '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: isActive ? '#EEF3FF' : 'transparent', color: isActive ? '#2563EB' : '#6B7280', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: isActive ? '#DBEAFE' : '#F3F4F6', color: isActive ? '#2563EB' : '#9CA3AF', flexShrink: 0, transition: 'all 0.15s ease' }}>
                      {cfg?.icon}
                    </span>
                    {!collapsed && <span style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 500 }}>{cfg?.label ?? tabId}</span>}
                  </div>
                  {!collapsed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#2563EB' : '#D1D5DB'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: collapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                <svg width="44" height="44" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={138.23 - (138.23 * progressPercent / 100)} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563EB' }}>{progressPercent}%</span>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#A0A8B8', letterSpacing: '0.04em' }}>READ</span>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reading Progress</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={138.23 - (138.23 * progressPercent / 100)} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB' }}>{progressPercent}%</span>
                  </div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{progressPercent >= 100 ? 'Finished!' : 'Keep reading'}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{progressPercent >= 100 ? 'Great job!' : progressPercent > 0 ? `${progressPercent}% done` : 'Not started'}</p>
                </div>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: '#EEF0F4', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: '999px', background: 'linear-gradient(90deg, #3B82F6, #2563EB)', transition: 'width 0.3s ease' }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Flashcard Stats */}
      {activeTab === 'flashcards' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: collapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                <svg width="44" height="44" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={flashcardStats.total > 0 ? 138.23 - (138.23 * (flashcardStats.current - 1) / flashcardStats.total) : 138.23} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563EB' }}>{flashcardStats.current}/{flashcardStats.total}</span>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#A0A8B8', letterSpacing: '0.04em' }}>CARDS</span>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <StatPill label="Total"     value={flashcardStats.total}     color="blue"  />
                <StatPill label="Important" value={flashcardStats.important} color="amber" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz Stats */}
      {activeTab === 'quiz' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: collapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                <svg width="44" height="44" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={quizStats.total > 0 ? 138.23 - (138.23 * quizStats.correct / quizStats.total) : 138.23} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#16A34A' }}>{quizStats.answered > 0 ? Math.round(quizStats.correct / quizStats.answered * 100) : 0}%</span>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#A0A8B8', letterSpacing: '0.04em' }}>SCORE</span>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quiz Progress</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
      {activeTab === 'previous-years' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: collapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                <svg width="44" height="44" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#EEF0F4" strokeWidth="5"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" strokeDasharray="138.23" strokeDashoffset={pyqStats.total > 0 ? 138.23 - (138.23 * pyqStats.answered / pyqStats.total) : 138.23} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#D97706' }}>{pyqStats.answered}/{pyqStats.total}</span>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#A0A8B8', letterSpacing: '0.04em' }}>PYQ</span>
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Previous Years</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <StatPill label="Total"     value={pyqStats.total}     color="blue"  />
                <StatPill label="Important" value={pyqStats.important} color="amber" />
                <StatPill label="Answered"  value={pyqStats.answered}  color="green" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Content Search */}
      {!collapsed && (activeTab === 'sheet' || activeTab === 'summary') && (
        <LectureContentSearch
          sheetContent={activeTab === 'sheet' ? sheetContent : ''}
          summaryContent={activeTab === 'summary' ? summaryContent : ''}
          activeTab={activeTab}
        />
      )}

      {/* Table of Contents */}
      {tocSections.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: collapsed ? '10px 6px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {collapsed ? (
            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center', scrollbarWidth: 'none' }}>
              {tocSections.filter(s => s.level <= 2).map((section) => {
                const isMain = section.level === 1
                const label  = isMain ? `${section.h1Num}` : `${section.h1Num}${String.fromCharCode(96 + section.h2Num!)}`
                return (
                  <button key={section.id} id={`toc-btn-${section.id}`} onClick={() => handleTocClick(section.id)} title={section.label}
                    style={{ width: '32px', height: '20px', borderRadius: '6px', border: 'none', background: activeSectionId === section.id ? '#2563EB' : isMain ? '#EEF3FF' : 'transparent', color: activeSectionId === section.id ? '#fff' : isMain ? '#2563EB' : '#94A3B8', fontSize: '10px', fontWeight: isMain ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, transition: 'background 0.2s, color 0.2s' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Table of Contents</p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '260px', overflowY: 'auto' }}>
                {tocSections.filter(s => s.level <= 3).map((section) => {
                  let numLabel = ''
                  if (section.level === 1) numLabel = `${section.h1Num}`
                  else if (section.level === 2) { const letter = String.fromCharCode(96 + section.h2Num!); numLabel = section.h1Num > 0 ? `${section.h1Num}${letter}` : `${section.h2Num}` }
                  else numLabel = '·'
                  const isMainHeading = section.level === 1
                  return (
                    <button key={section.id} onClick={() => handleTocClick(section.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: isMainHeading ? '9px 10px' : '6px 10px 6px 18px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: isMainHeading ? '#2563EB' : '#EEF3FF', color: isMainHeading ? '#fff' : '#2563EB', fontSize: isMainHeading ? '11px' : '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 4px' }}>
                        {numLabel}
                      </span>
                      <span style={{ fontSize: isMainHeading ? '13px' : '12px', fontWeight: isMainHeading ? 700 : 500, color: isMainHeading ? '#1E293B' : '#475569', lineHeight: 1.4 }}>
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

      {/* Notes */}
      {!collapsed && <NotesPanel lectureId={lecture.id} />}

      {/* Actions */}
      {!collapsed && !!user && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={handleToggleBookmark}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid #EAEDF2', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: isBookmarked ? '#FFF7ED' : '#fff', color: isBookmarked ? '#D97706' : '#6B7280', transition: 'all 0.15s ease' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? '#D97706' : 'none'} stroke={isBookmarked ? '#D97706' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <Link href={`/${uniSlug}/${subjectSlug}`} prefetch={false}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid #EAEDF2', fontSize: '13px', fontWeight: 500, color: '#6B7280', background: '#fff', textDecoration: 'none', transition: 'all 0.15s ease' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Subject
            </Link>
          </div>
        </div>
      )}

      <div style={{ height: '8px' }} />
    </>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── TABLET: Overlay + Drawer + Trigger button ── */}
      {isTablet && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 49,
              background: 'rgba(0,0,0,0.4)',
              opacity: drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? 'auto' : 'none',
              transition: 'opacity 0.25s ease',
            }}
          />

          {/* Drawer panel */}
          <aside
            style={{
              position: 'fixed', top: 72, right: 0, bottom: 0, zIndex: 50,
              width: '300px',
              background: '#F7F8FA',
              borderLeft: '1px solid #EEF0F4',
              display: 'flex', flexDirection: 'column', gap: '12px',
              padding: '12px',
              overflowY: 'auto',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(300px)',
              transition: 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 40, borderRadius: 10, border: '1px solid #EAEDF2', background: '#fff', cursor: 'pointer', color: '#6B7280', padding: '0 14px', flexShrink: 0 }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Lecture Tools</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {sidebarContent}
          </aside>

          {/* Floating trigger button */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            style={{
              position: 'fixed',
              right: drawerOpen ? '300px' : '0',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 51,
              width: 28, height: 64,
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: '8px 0 0 8px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '-2px 0 8px rgba(37,99,235,0.3)',
              transition: 'right 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {drawerOpen
                ? <polyline points="9 18 15 12 9 6"/>
                : <polyline points="15 18 9 12 15 6"/>
              }
            </svg>
          </button>
        </>
      )}

      {/* ── DESKTOP: Static sidebar ── */}
      {!isTablet && (
        <aside
          id="lecture-right-sidebar"
          className="hidden lg:flex"
          style={{ width: sidebarCollapsed ? '64px' : '272px', height: 'calc(100vh - 72px)', overflowY: 'auto', borderLeft: '1px solid #EEF0F4', background: '#F7F8FA', flexDirection: 'column', gap: '12px', padding: sidebarCollapsed ? '16px 8px' : '16px 12px', flexShrink: 0, transition: 'width 0.25s ease, padding 0.25s ease' }}
        >
          {sidebarContent}
        </aside>
      )}
    </>
  )
}
