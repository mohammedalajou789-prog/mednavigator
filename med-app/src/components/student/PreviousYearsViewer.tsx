'use client'

import { useState } from 'react'
import type { PreviousYearQuestion } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import WatermarkOverlay from '@/components/common/WatermarkOverlay'
import ContentProtectionWrapper from '@/components/common/ContentProtectionWrapper'

interface PreviousYearsViewerProps {
  questions: PreviousYearQuestion[]
  userName?: string
}

const EXAM_TYPE_LABELS: Record<string, string> = { final: 'Final', midterm: 'Midterm', quiz: 'Quiz', practical: 'Practical' }

export default function PreviousYearsViewer({ questions, userName }: PreviousYearsViewerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const years = [...new Set(questions.map((q) => q.exam_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0))
  const types = [...new Set(questions.map((q) => q.exam_type).filter(Boolean))]

  const filtered = questions.filter((q) => {
    if (filterYear !== 'all' && String(q.exam_year) !== filterYear) return false
    if (filterType !== 'all' && q.exam_type !== filterType) return false
    return true
  })

  function handleAnswer(questionId: string, option: string) {
    if (answers[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  return (
    <ContentProtectionWrapper className="max-w-3xl mx-auto px-6 py-6 relative">
      {userName && <WatermarkOverlay userName={userName} />}
      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
        <span>{questions.length} total questions</span>
        {years.length > 0 && <span>· {years[years.length - 1]} – {years[0]}</span>}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t ?? ''}>{EXAM_TYPE_LABELS[t ?? ''] ?? t}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} questions</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No questions match the selected filters.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, index) => {
            const options = Array.isArray(q.options) ? q.options as string[] : []
            const optionLabels = ['A', 'B', 'C', 'D', 'E']
            const selected = answers[q.id]
            const answered = !!selected
            return (
              <div key={q.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Q{index + 1}</span>
                  {q.exam_year && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">{q.exam_year}</span>}
                  {q.exam_type && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">{EXAM_TYPE_LABELS[q.exam_type] ?? q.exam_type}</span>}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-4 leading-relaxed">{q.question}</p>
                {options.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {options.map((opt, i) => {
                      const label = optionLabels[i]
                      const isCorrect = q.correct_answer === label
                      const isSelected = selected === label
                      return (
                        <button key={i} onClick={() => handleAnswer(q.id, label)} disabled={answered}
                          className={cn('w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors',
                            !answered ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              : isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100'
                              : isSelected && !isCorrect ? 'border-red-400 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'
                              : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600')}>
                          <span className="font-semibold flex-shrink-0 w-5">{label}.</span>
                          <span>{opt}</span>
                          {answered && isCorrect && <span className="ml-auto text-green-500">✓</span>}
                          {answered && isSelected && !isCorrect && <span className="ml-auto text-red-400">✗</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {answered && q.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Explanation</p>
                    <p className="text-xs text-blue-900 dark:text-blue-200">{q.explanation}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ContentProtectionWrapper>
  )
}