'use client'

import Link from 'next/link'

interface TocSection {
  number: number
  label: string
  status: 'done' | 'active' | 'pending'
}

interface LectureRightSidebarProps {
  lectureId: string
  subjectId: string
  universityId: string
  progressPercent: number          // 0-100, reading progress from SheetReader
  isCompleted: boolean
  isBookmarked: boolean
  onMarkComplete: () => void
  onToggleBookmark: () => void
  tocSections?: TocSection[]
  lastNote?: { content: string; updatedAt: string } | null
  activeTab: string                // 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'
  onTabChange: (tab: string) => void
  availableTabs: string[]          // which tabs have content
}

const DEFAULT_TOC: TocSection[] = [
  { number: 1, label: 'Definition', status: 'done' },
  { number: 2, label: 'Epidemiology', status: 'done' },
  { number: 3, label: 'Pathophysiology', status: 'done' },
  { number: 4, label: 'Symptoms', status: 'active' },
  { number: 5, label: 'Diagnosis', status: 'pending' },
  { number: 6, label: 'Treatment', status: 'pending' },
  { number: 7, label: 'Complications', status: 'pending' },
  { number: 8, label: 'Summary', status: 'pending' },
]

const TOOL_TABS = [
  { id: 'sheet', label: 'Sheet', icon: 'ti-file-text' },
  { id: 'flashcards', label: 'Flashcards', icon: 'ti-cards' },
  { id: 'quiz', label: 'Quiz', icon: 'ti-help-circle' },
  { id: 'previous_years', label: 'PYQs', icon: 'ti-clock-history' },
]

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Circle progress: r=25, circumference = 2π×25 ≈ 157.08
const CIRC = 157.08

export default function LectureRightSidebar({
  lectureId,
  subjectId,
  universityId,
  progressPercent,
  isCompleted,
  isBookmarked,
  onMarkComplete,
  onToggleBookmark,
  tocSections = DEFAULT_TOC,
  lastNote,
  activeTab,
  onTabChange,
  availableTabs,
}: LectureRightSidebarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progressPercent)))
  const strokeOffset = CIRC - (CIRC * pct) / 100

  const motivationalText =
    pct === 100 ? 'Completed!' :
    pct >= 75 ? 'Almost there!' :
    pct >= 50 ? 'Keep going!' :
    pct >= 25 ? "Good progress!" :
    'Just started'

  const motivationalSub =
    pct === 100 ? 'Well done.' :
    pct >= 75 ? "You're nearly done." :
    pct >= 50 ? "You're doing great." :
    pct >= 25 ? 'Stay consistent.' :
    'Start reading.'

  return (
    <aside className="w-[260px] min-w-[260px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-y-auto flex flex-col gap-3 p-4">

      {/* ── CARD 1: PROGRESS ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Your Progress
        </p>
        <div className="flex items-center gap-3">
          {/* SVG circle */}
          <div className="relative w-[62px] h-[62px] flex-shrink-0">
            <svg width="62" height="62" viewBox="0 0 62 62" className="rotate-[-90deg]">
              <circle
                cx="31" cy="31" r="25"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="5"
                className="dark:stroke-slate-600"
              />
              <circle
                cx="31" cy="31" r="25"
                fill="none"
                stroke="#2563EB"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
                {pct}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              {motivationalText}
            </p>
            <p className="text-[12px] text-green-600 dark:text-green-400 font-medium">
              {pct}% Read
            </p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">
              {motivationalSub}
            </p>
          </div>
        </div>
      </div>

      {/* ── CARD 2: TABLE OF CONTENTS ────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Table of Contents
        </p>
        <div className="flex flex-col">
          {tocSections.map((section, idx) => (
            <div key={section.number} className="flex items-start gap-2.5 relative">
              {/* Vertical line between dots */}
              {idx < tocSections.length - 1 && (
                <div
                  className={`
                    absolute left-[9px] top-[18px] w-px bottom-[-4px]
                    ${section.status === 'done' ? 'bg-green-300 dark:bg-green-700' : 'bg-slate-200 dark:bg-slate-600'}
                  `}
                />
              )}
              {/* Dot */}
              <div className="flex-shrink-0 mt-0.5 z-10">
                {section.status === 'done' ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-green-500 flex items-center justify-center">
                    <i className="ti ti-check text-white" style={{ fontSize: '10px' }} aria-hidden="true" />
                  </div>
                ) : section.status === 'active' ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">{section.number}</span>
                  </div>
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-400 text-[9px] font-bold">{section.number}</span>
                  </div>
                )}
              </div>
              {/* Label */}
              <p className={`
                text-[12.5px] pb-3
                ${section.status === 'active'
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : section.status === 'done'
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-500 dark:text-slate-400'
                }
              `}>
                {section.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD 3: MY NOTES ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          My Notes
        </p>
        {lastNote ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-[12.5px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 mb-2">
              {lastNote.content}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                {formatTimeAgo(lastNote.updatedAt)}
              </span>
              <Link
                href={`/notes?lecture=${lectureId}`}
                className="text-[11.5px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline"
              >
                Open Notes
                <i className="ti ti-arrow-right text-[12px]" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href={`/notes?lecture=${lectureId}`}
            className="flex items-center gap-2 text-[13px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <i className="ti ti-plus text-[16px]" aria-hidden="true" />
            Add a note for this lecture
          </Link>
        )}
      </div>

      {/* ── CARD 4: LEARNING TOOLS ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Learning Tools
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TOOL_TABS.filter(t => availableTabs.includes(t.id)).map((tool) => (
            <button
              key={tool.id}
              onClick={() => onTabChange(tool.id)}
              className={`
                flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg border transition-all
                ${activeTab === tool.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                  : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200'
                }
              `}
              aria-label={tool.label}
            >
              <i className={`ti ${tool.icon} text-[20px] ${activeTab === tool.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} aria-hidden="true" />
              <span className={`text-[10px] font-medium text-center leading-tight ${activeTab === tool.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CARD 5: ACTIONS ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Actions
        </p>

        {/* Mark as Completed */}
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

        {/* Bookmark */}
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
          {isBookmarked ? 'Bookmarked' : 'Bookmark this Lecture'}
        </button>
      </div>

    </aside>
  )
}