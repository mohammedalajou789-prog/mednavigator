'use client'

import { useState, useEffect } from 'react'
import type { PreviousYearQuestion } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

interface PreviousYearsViewerProps {
  questions: PreviousYearQuestion[]
  userName?: string
  onStatsChange?: (stats: { total: number; important: number; answered: number }) => void
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  final: 'Final', midterm: 'Midterm', quiz: 'Quiz', practical: 'Practical'
}

export default function PreviousYearsViewer({ questions, userName, onStatsChange }: PreviousYearsViewerProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [importantIds, setImportantIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const years = [...new Set(questions.map((q) => q.exam_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0))
  const types = [...new Set(questions.map((q) => q.exam_type).filter(Boolean))]

  const filtered = questions.filter((q) => {
    if (filterYear !== 'all' && String(q.exam_year) !== filterYear) return false
    if (filterType !== 'all' && q.exam_type !== filterType) return false
    if (showImportantOnly && !importantIds.has(q.id)) return false
    return true
  })

  // Load important bookmarks
  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('bookmarks')
        .select('question_id')
        .eq('user_id', user!.id)
        .eq('bookmark_type', 'question')
        .not('question_id', 'is', null)
      if (data) {
        setImportantIds(new Set(data.map((b: { question_id: string }) => b.question_id)))
      }
      setLoading(false)
    }
    load()
  }, [user])

  // Emit stats
  useEffect(() => {
    onStatsChange?.({
      total: questions.length,
      important: importantIds.size,
      answered: Object.keys(answers).length,
    })
  }, [importantIds.size, Object.keys(answers).length, questions.length])

  async function toggleImportant(questionId: string) {
    if (!user) return
    if (importantIds.has(questionId)) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .eq('bookmark_type', 'question')
      setImportantIds(prev => { const n = new Set(prev); n.delete(questionId); return n })
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        question_id: questionId,
        bookmark_type: 'question',
      })
      setImportantIds(prev => new Set([...prev, questionId]))
    }
  }

  function handleAnswer(questionId: string, option: string) {
    if (answers[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 relative" onContextMenu={(e) => e.preventDefault()} style={{ userSelect: 'none' }}>
      {userName && (
        <div className="pointer-events-none select-none absolute inset-0 z-10 overflow-hidden opacity-[0.04]" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-gray-900 dark:text-white text-sm font-medium whitespace-nowrap"
              style={{ top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}

      {/* Stats + filters */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 flex-wrap">
        <span>{questions.length} total</span>
        {importantIds.size > 0 && (
          <span className="text-amber-500">⭐ {importantIds.size} important</span>
        )}
        {years.length > 0 && (
          <span className="text-slate-400">· {years[years.length - 1]} – {years[0]}</span>
        )}
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

        {importantIds.size > 0 && (
          <button
            onClick={() => setShowImportantOnly(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              showImportantOnly
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }`}
          >
            ⭐ {showImportantOnly ? 'Show all' : 'Important only'}
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} questions</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {showImportantOnly ? (
            <>
              <p className="text-4xl mb-4">⭐</p>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No important questions yet</p>
              <p className="text-slate-400 text-sm mb-6">Mark questions as important by clicking ⭐</p>
              <button
                onClick={() => setShowImportantOnly(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Show all questions
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No questions match the selected filters.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, index) => {
            const options = Array.isArray(q.options) ? q.options as string[] : []
            const optionLabels = ['A', 'B', 'C', 'D', 'E']
            const selected = answers[q.id]
            const answered = !!selected
            const isImportant = importantIds.has(q.id)

            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-5 transition-all ${
                  isImportant
                    ? 'border-amber-300 dark:border-amber-700'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                {/* Question header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      Q{index + 1}
                    </span>
                    {q.exam_year && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {q.exam_year}
                      </span>
                    )}
                    {q.exam_type && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                        {EXAM_TYPE_LABELS[q.exam_type] ?? q.exam_type}
                      </span>
                    )}
                  </div>

                  {/* Important button */}
                  {user && (
                    <button
                      onClick={() => toggleImportant(q.id)}
                      className={`text-lg flex-shrink-0 transition-all hover:scale-110 ${
                        isImportant ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700 hover:text-amber-300'
                      }`}
                      title={isImportant ? 'Remove from important' : 'Mark as important'}
                    >
                      ⭐
                    </button>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-900 dark:text-white mb-4 leading-relaxed">
                  {q.question}
                </p>

                {options.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {options.map((opt, i) => {
                      const label = optionLabels[i]
                      const isCorrect = q.correct_answer === label
                      const isSelected = selected === label
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(q.id, label)}
                          disabled={answered}
                          className={cn(
                            'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors',
                            !answered
                              ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              : isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100'
                              : isSelected && !isCorrect
                              ? 'border-red-400 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'
                              : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                          )}
                        >
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
    </div>
  )
}