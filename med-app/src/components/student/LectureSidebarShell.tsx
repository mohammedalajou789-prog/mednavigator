'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Derive active tab from URL pathname
  const activeTab = allTabs.find(tab => pathname.endsWith('/' + tab)) ?? allTabs[0] ?? 'sheet'

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1280 : false
  )
  const [isBookmarked, setIsBookmarked]         = useState(false)
  const [progressPercent, setProgressPercent]   = useState(0)
  const [isCompleted, setIsCompleted]           = useState(false)
  const [tocSections, setTocSections]           = useState<TocSection[]>([])
  const [activeSectionId, setActiveSectionId]   = useState<string>('')
  const [flashcardStats, setFlashcardStats]     = useState<FlashcardStats>({ total: 0, easy: 0, medium: 0, hard: 0, current: 1, important: 0 })
  const [quizStats, setQuizStats]               = useState<QuizStats>({ total: 0, answered: 0, correct: 0, current: 1, important: 0 })
  const [pyqStats, setPyqStats]                 = useState<PyqStats>({ total: 0, important: 0, answered: 0 })
  const [sheetContent, setSheetContent]         = useState('')
  const [summaryContent, setSummaryContent]     = useState('')

  const prevSectionId = useRef<string>('')

  // ── Listen for events from child pages ────────────────────────────────────
  useEffect(() => {
    function handleSidebarEvent(e: CustomEvent) {
      const { type, data } = e.detail
      if (type === 'progress')        { setProgressPercent(data.percent); setIsCompleted(data.completed) }
      if (type === 'toc')             { setTocSections(data.sections); }
      if (type === 'flashcardStats')  { setFlashcardStats(data) }
      if (type === 'quizStats')       { setQuizStats(data) }
      if (type === 'pyqStats')        { setPyqStats(data) }
      if (type === 'sheetContent')    { setSheetContent(data.content) }
      if (type === 'summaryContent')  { setSummaryContent(data.content) }
    }
    window.addEventListener('lecture-sidebar-update', handleSidebarEvent as EventListener)
    return () => window.removeEventListener('lecture-sidebar-update', handleSidebarEvent as EventListener)
  }, [])

  // ── Reset dynamic widgets when tab changes ────────────────────────────────
  useEffect(() => {
    setTocSections([])
    setActiveSectionId('')
    setProgressPercent(0)
    setIsCompleted(false)
    prevSectionId.current = ''
  }, [activeTab])

  // ── TOC scroll tracking ───────────────────────────────────────────────────
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

  // ── Bookmark ──────────────────────────────────────────────────────────────
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

  return (
    <aside
      id="lecture-right-sidebar"
      className="hidden md:flex"
      style={{ width: sidebarCollapsed ? '64px' : '272px', height: 'calc(100vh - 72px)', overflowY: 'auto', borderLeft: '1px solid #EEF0F4', background: '#F7F8FA', flexDirection: 'column', gap: '12px', padding: sidebarCollapsed ? '16px 8px' : '16px 12px', flexShrink: 0, transition: 'width 0.25s ease, padding 0.25s ease' }}
    >
      {/* Collapse button */}
      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 36, borderRadius: 10, border: '1px solid #EAEDF2', background: '#fff', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {sidebarCollapsed ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
        </svg>
      </button>

      {/* Content Tabs — now Link-based navigation */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: sidebarCollapsed ? '8px' : '14px 16px 10px' }}>
          {!sidebarCollapsed && (
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Content</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', ...(sidebarCollapsed && { maxHeight: '300px', overflowY: 'auto', scrollbarWidth: 'none' }) }}>
            {allTabs.map((tabId) => {
              const cfg      = TAB_CONFIG[tabId]
              const isActive = activeTab === tabId
              const href     = `/${uniSlug}/${subjectSlug}/${lectureSlug}/${tabId}`
              return (
                <button key={tabId} title={cfg?.label ?? tabId} onClick={() => { localStorage.setItem(`lecture:${lecture.id}:active_tab`, tabId); router.replace(href) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: sidebarCollapsed ? '10px' : '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: isActive ? '#EEF3FF' : 'transparent', color: isActive ? '#2563EB' : '#6B7280', transition: 'all 0.15s ease', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: isActive ? '#DBEAFE' : '#F3F4F6', color: isActive ? '#2563EB' : '#9CA3AF', flexShrink: 0, transition: 'all 0.15s ease' }}>
                      {cfg?.icon}
                    </span>
                    {!sidebarCollapsed && <span style={{ fontSize: '13.5px', fontWeight: isActive ? 600 : 500 }}>{cfg?.label ?? tabId}</span>}
                  </div>
                  {!sidebarCollapsed && (
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

      {/* Reading Progress — sheet and summary only */}
      {!!user && (activeTab === 'sheet' || activeTab === 'summary') && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {sidebarCollapsed ? (
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
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {sidebarCollapsed ? (
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
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {sidebarCollapsed ? (
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
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: sidebarCollapsed ? '12px 8px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {sidebarCollapsed ? (
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
      {!sidebarCollapsed && (activeTab === 'sheet' || activeTab === 'summary') && (
        <LectureContentSearch
          sheetContent={activeTab === 'sheet' ? sheetContent : ''}
          summaryContent={activeTab === 'summary' ? summaryContent : ''}
          activeTab={activeTab}
        />
      )}

      {/* Table of Contents */}
      {tocSections.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: sidebarCollapsed ? '10px 6px' : '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {sidebarCollapsed ? (
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
      {!sidebarCollapsed && <NotesPanel lectureId={lecture.id} />}

      {/* Actions */}
      {!sidebarCollapsed && !!user && (
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
    </aside>
  )
}
