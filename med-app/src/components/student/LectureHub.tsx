'use client'

import { useState } from 'react'
import SheetReader from './SheetReader'
import FlashcardsViewer from './FlashcardsViewer'
import QuizViewer from './QuizViewer'
import PreviousYearsViewer from './PreviousYearsViewer'

interface LectureHubProps {
  lecture: Record<string, unknown>
  sheet: Record<string, unknown> | null
  summary: Record<string, unknown> | null
  flashcards: Record<string, unknown>[]
  quizQuestions: Record<string, unknown>[]
  previousYears: Record<string, unknown>[]
}

type TabId = 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'

export default function LectureHub({
  lecture,
  sheet,
  summary,
  flashcards,
  quizQuestions,
  previousYears,
}: LectureHubProps) {
  const tabs: { id: TabId; label: string; icon: string; count?: number; available: boolean }[] = [
    { id: 'sheet', label: 'Sheet', icon: '📄', available: !!sheet },
    { id: 'summary', label: 'Summary', icon: '📝', available: !!summary },
    { id: 'flashcards', label: 'Flashcards', icon: '🃏', count: flashcards.length, available: flashcards.length > 0 },
    { id: 'quiz', label: 'Quiz', icon: '✏️', count: quizQuestions.length, available: quizQuestions.length > 0 },
    { id: 'previous_years', label: 'Previous Years', icon: '📅', count: previousYears.length, available: previousYears.length > 0 },
  ].filter(t => t.available)

  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'sheet')

  if (tabs.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium text-[#0F172A]">No content available yet.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-4 shadow-sm">
        <h1 className="text-xl font-semibold text-[#0F172A]">{String(lecture.title)}</h1>
        {lecture.description && (
          <p className="text-[#64748B] mt-1 text-sm">{String(lecture.description)}</p>
        )}
      </div>

      <div className="flex gap-1 bg-white rounded-xl border border-[#E2E8F0] p-1.5 mb-4 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'sheet' && sheet && (
          <SheetReader content={String(sheet.content ?? '')} title={String(sheet.title ?? '')} />
        )}
        {activeTab === 'summary' && summary && (
          <SheetReader content={String(summary.content ?? '')} title={String(summary.title ?? '')} isSummary={true} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsViewer questions={flashcards as never} />
        )}
        {activeTab === 'quiz' && (
          <QuizViewer questions={quizQuestions as never} />
        )}
        {activeTab === 'previous_years' && (
          <PreviousYearsViewer questions={previousYears as never} />
        )}
      </div>
    </div>
  )
}