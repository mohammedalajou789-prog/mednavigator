'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TocSection {
  id: string
  level: number
  label: string
}

interface FlashcardStats {
  total: number
  easy: number
  medium: number
  hard: number
  current: number
}

interface QuizStats {
  total: number
  answered: number
  correct: number
  current: number
}

interface LectureRightSidebarProps {
  lectureId: string
  subjectId: string
  universityId: string
  activeTab: string
  tocSections?: TocSection[]
  onTocClick?: (id: string) => void
  progressPercent?: number
  flashcardStats?: FlashcardStats
  quizStats?: QuizStats
  isCompleted: boolean
  isBookmarked: boolean
  onMarkComplete: () => void
  onToggleBookmark: () => void
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LectureRightSidebar({
  lectureId,
  subjectId,
  universityId,
  activeTab,
  tocSections = [],
  onTocClick,
  progressPercent = 0,
  flashcardStats,
  quizStats,
  isCompleted,
  isBookmarked,
  onMarkComplete,
  onToggleBookmark,
}: LectureRightSidebarProps) {
  return (
    <aside className="w-[260px] min-w-[260px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col gap-3 p-3">

      {(activeTab === 'sheet' || activeTab === 'summary') && (
        <SheetSidebar
          tocSections={tocSections}
          onTocClick={onTocClick}
          progressPercent={progressPercent}
          lectureId={lectureId}
        />
      )}

      {activeTab === 'flashcards' && flashcardStats && (
        <FlashcardSidebar stats={flashcardStats} />
      )}

      {activeTab === 'quiz' && quizStats && (
        <QuizSidebar stats={quizStats} />
      )}

      {activeTab === 'previous_years' && (
        <PreviousYearsSidebar />
      )}

      <ActionCard
        isCompleted={isCompleted}
        isBookmarked={isBookmarked}
        onMarkComplete={onMarkComplete}
        onToggleBookmark={onToggleBookmark}
      />

    </aside>
  )
}

// ── Sheet Sidebar ──────────────────────────────────────────────────────────────

function SheetSidebar({
  tocSections,
  onTocClick,
  progressPercent,
  lectureId,
}: {
  tocSections: TocSection[]
  onTocClick?: (id: string) => void
  progressPercent: number
  lectureId: string
}) {
  return (
    <>
      <ProgressCard progressPercent={progressPercent} />

      {tocSections.length > 0 && (
        <SidebarCard title="Table of Contents">
          <div className="flex flex-col gap-0">
            {tocSections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => onTocClick?.(section.id)}
                className="flex items-center gap-2.5 py-1.5 text-left w-full group hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-1 transition-all"
              >
                <span className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
                  ${section.level === 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}
                `}>
                  {idx + 1}
                </span>
                <span className={`
                  text-[12px] leading-tight
                  ${section.level === 1
                    ? 'text-slate-700 dark:text-slate-200 font-medium'
                    : 'text-slate-500 dark:text-slate-400 pl-1'}
                `}>
                  {section.label}
                </span>
              </button>
            ))}
          </div>
        </SidebarCard>
      )}

      <NotesCard lectureId={lectureId} />
    </>
  )
}

// ── Progress Card ──────────────────────────────────────────────────────────────

function ProgressCard({ progressPercent }: { progressPercent: number }) {
  return (
    <SidebarCard title="Reading Progress">
      <div className="flex items-center gap-3">
        <CircleProgress pct={progressPercent} />
        <div>
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
            {progressPercent}% read
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {progressPercent >= 100 ? 'Finished!' : 'Keep going'}
          </p>
        </div>
      </div>
    </SidebarCard>
  )
}

// ── Flashcard Sidebar ──────────────────────────────────────────────────────────

function FlashcardSidebar({ stats }: { stats: FlashcardStats }) {
  const pct = stats.total > 0 ? Math.round((stats.current / stats.total) * 100) : 0

  return (
    <>
      <SidebarCard title="Progress">
        <div className="flex items-center gap-3 mb-3">
          <CircleProgress pct={pct} />
          <div>
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              Card {stats.current} of {stats.total}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{pct}% reviewed</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <p className="text-[18px] font-bold text-green-600 dark:text-green-400">{stats.easy}</p>
            <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">Easy</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
            <p className="text-[18px] font-bold text-amber-600 dark:text-amber-400">{stats.medium}</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">Medium</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
            <p className="text-[18px] font-bold text-red-600 dark:text-red-400">{stats.hard}</p>
            <p className="text-[10px] text-red-700 dark:text-red-500 font-medium">Hard</p>
          </div>
        </div>
      </SidebarCard>

      <SidebarCard title="Study Tips">
        <div className="space-y-2">
          <Tip icon="ti-repeat" text="Review hard cards first" />
          <Tip icon="ti-brain" text="Try to answer before flipping" />
          <Tip icon="ti-clock" text="Short daily sessions work better" />
        </div>
      </SidebarCard>
    </>
  )
}

// ── Quiz Sidebar ───────────────────────────────────────────────────────────────

function QuizSidebar({ stats }: { stats: QuizStats }) {
  const scorePct = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0

  return (
    <>
      <SidebarCard title="Quiz Progress">
        <div className="flex items-center gap-3 mb-3">
          <CircleProgress pct={scorePct} color={scorePct >= 70 ? 'green' : scorePct >= 50 ? 'amber' : 'red'} />
          <div>
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              {stats.correct}/{stats.answered} correct
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {stats.total - stats.answered} remaining
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
            <p className="text-[18px] font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-500 font-medium">Total</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <p className="text-[18px] font-bold text-green-600 dark:text-green-400">{stats.correct}</p>
            <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">Correct</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2 text-center">
            <p className="text-[18px] font-bold text-slate-600 dark:text-slate-300">{stats.answered}</p>
            <p className="text-[10px] text-slate-500 font-medium">Done</p>
          </div>
        </div>
      </SidebarCard>

      <SidebarCard title="Study Tips">
        <div className="space-y-2">
          <Tip icon="ti-flag" text="Flag uncertain answers for review" />
          <Tip icon="ti-book" text="Read explanations even for correct answers" />
          <Tip icon="ti-refresh" text="Retake the quiz after reviewing mistakes" />
        </div>
      </SidebarCard>
    </>
  )
}

// ── Previous Years Sidebar ─────────────────────────────────────────────────────

function PreviousYearsSidebar() {
  return (
    <SidebarCard title="Exam Tips">
      <div className="space-y-2">
        <Tip icon="ti-calendar" text="Filter by exam year to focus on recent exams" />
        <Tip icon="ti-chart-bar" text="Track which topics appear most frequently" />
        <Tip icon="ti-repeat" text="Review wrong answers thoroughly" />
        <Tip icon="ti-clock" text="Practice under timed conditions" />
      </div>
    </SidebarCard>
  )
}

// ── Notes Card ─────────────────────────────────────────────────────────────────

function NotesCard({ lectureId }: { lectureId: string }) {
  const { user } = useUserStore()
  const supabase = createClient()
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noteId, setNoteId] = useState<string | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('user_notes')
        .select('id, note_content')
        .eq('user_id', user!.id)
        .eq('lecture_id', lectureId)
        .maybeSingle()
      if (data) {
        setNote(data.note_content ?? '')
        setNoteId(data.id)
      }
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
      await supabase
        .from('user_notes')
        .update({ note_content: content, updated_at: new Date().toISOString() })
        .eq('id', noteId)
    } else {
      const { data } = await supabase
        .from('user_notes')
        .insert({ user_id: user.id, lecture_id: lectureId, note_content: content })
        .select('id')
        .maybeSingle()
      if (data) setNoteId(data.id)
    }
    setSaved(true)
  }

  return (
    <SidebarCard title="My Notes">
      {loading ? (
        <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
      ) : (
        <div>
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your notes for this lecture..."
            rows={5}
            className="w-full text-[12.5px] text-slate-700 dark:text-slate-200 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 resize-none outline-none focus:border-amber-400 dark:focus:border-amber-600 placeholder-slate-400 transition-all leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-slate-400">{note.length} characters</span>
            {saved && (
              <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                <i className="ti ti-check text-[11px]" aria-hidden="true" />
                Saved
              </span>
            )}
            {!saved && note.length > 0 && (
              <span className="text-[10px] text-slate-400">Saving...</span>
            )}
          </div>
        </div>
      )}
    </SidebarCard>
  )
}

// ── Action Card ────────────────────────────────────────────────────────────────

function ActionCard({
  isCompleted,
  isBookmarked,
  onMarkComplete,
  onToggleBookmark,
}: {
  isCompleted: boolean
  isBookmarked: boolean
  onMarkComplete: () => void
  onToggleBookmark: () => void
}) {
  return (
    <SidebarCard title="Actions">
      <button
        onClick={onMarkComplete}
        className={`
          w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold mb-2 transition-all
          ${isCompleted
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
          }
        `}
      >
        <i className={`ti ${isCompleted ? 'ti-circle-check-filled' : 'ti-circle-check'} text-[16px]`} aria-hidden="true" />
        {isCompleted ? 'Completed ✓' : 'Mark as Completed'}
      </button>
      <button
        onClick={onToggleBookmark}
        className={`
          w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium border transition-all
          ${isBookmarked
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400'
            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
          }
        `}
      >
        <i className={`ti ${isBookmarked ? 'ti-bookmark-filled' : 'ti-bookmark'} text-[15px]`} aria-hidden="true" />
        {isBookmarked ? 'Bookmarked' : 'Bookmark Lecture'}
      </button>
    </SidebarCard>
  )
}

// ── Shared Components ──────────────────────────────────────────────────────────

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
        {title}
      </p>
      {children}
    </div>
  )
}

function CircleProgress({
  pct,
  color = 'blue',
}: {
  pct: number
  color?: 'blue' | 'green' | 'amber' | 'red'
}) {
  const CIRC = 157.08
  const offset = CIRC - (CIRC * pct) / 100
  const strokeColor =
    color === 'green' ? '#16A34A' :
    color === 'amber' ? '#D97706' :
    color === 'red' ? '#DC2626' :
    '#2563EB'

  return (
    <div className="relative w-[52px] h-[52px] flex-shrink-0">
      <svg width="52" height="52" viewBox="0 0 52 52" className="rotate-[-90deg]">
        <circle cx="26" cy="26" r="22" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-600" />
        <circle
          cx="26" cy="26" r="22"
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{pct}%</span>
      </div>
    </div>
  )
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <i className={`ti ${icon} text-[14px] text-blue-500 mt-0.5 flex-shrink-0`} aria-hidden="true" />
      <span className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">{text}</span>
    </div>
  )
}