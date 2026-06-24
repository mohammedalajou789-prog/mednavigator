'use client'

import { useState, useEffect } from 'react'
import type { QuizQuestion } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

interface QuizViewerProps {
  questions: QuizQuestion[]
  userName?: string
  lectureId?: string
  onStatsChange?: (stats: {
    total: number
    answered: number
    correct: number
    current: number
    important: number
  }) => void
}

const OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

const Watermark = ({ userName }: { userName: string }) => (
  <div className="pointer-events-none select-none absolute inset-0 z-10 overflow-hidden opacity-[0.04]" aria-hidden="true">
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="absolute text-gray-900 dark:text-white text-sm font-medium whitespace-nowrap"
        style={{ top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
        {userName}
      </div>
    ))}
  </div>
)

export default function QuizViewer({ questions, userName, lectureId, onStatsChange }: QuizViewerProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [importantIds, setImportantIds] = useState<Set<string>>(new Set())
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  const displayQuestions = showImportantOnly
    ? questions.filter(q => importantIds.has(q.id))
    : questions

  const current = displayQuestions[currentIndex]
  const total = displayQuestions.length
  const answeredCount = Object.keys(answers).length
  const correctCount = questions.filter((q) => answers[q.id] === q.correct_answer).length
  const score = answeredCount > 0 ? Math.round((correctCount / questions.length) * 100) : 0

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
      answered: answeredCount,
      correct: correctCount,
      current: currentIndex + 1,
      important: importantIds.size,
    })
  }, [currentIndex, answeredCount, correctCount, importantIds.size, questions.length])

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
    setShowExplanation((prev) => ({ ...prev, [questionId]: true }))
  }

  function getOptionLabel(q: QuizQuestion, option: string): string | null {
    const map: Record<string, string | null> = {
      A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d, E: q.option_e
    }
    return map[option] ?? null
  }

  function getOptionStyle(q: QuizQuestion, option: string) {
    const selected = answers[q.id]
    const isCorrect = q.correct_answer === option
    const isSelected = selected === option
    const isAnswered = !!selected
    if (!isAnswered) return isSelected
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    if (isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100'
    if (isSelected && !isCorrect) return 'border-red-400 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'
    return 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center relative" onContextMenu={(e) => e.preventDefault()} style={{ userSelect: 'none' }}>
        {userName && <Watermark userName={userName} />}
        <div className="text-5xl font-bold text-blue-600 mb-2">{score}%</div>
        <p className="text-gray-500 mb-1">{correctCount} correct out of {questions.length} questions</p>
        {importantIds.size > 0 && (
          <p className="text-amber-500 text-sm mb-4">⭐ {importantIds.size} marked as important</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => { setFinished(false); setCurrentIndex(0); setAnswers({}); setShowExplanation({}) }}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retry quiz
          </button>
          {importantIds.size > 0 && (
            <button
              onClick={() => { setFinished(false); setCurrentIndex(0); setAnswers({}); setShowExplanation({}); setShowImportantOnly(true) }}
              className="px-6 py-2.5 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors"
            >
              ⭐ Review important
            </button>
          )}
        </div>
      </div>
    )
  }

  if (showImportantOnly && displayQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-4xl mb-4">⭐</p>
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No important questions yet</p>
        <p className="text-slate-400 text-sm mb-6">Mark questions as important by clicking ⭐</p>
        <button
          onClick={() => setShowImportantOnly(false)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Show all questions
        </button>
      </div>
    )
  }

  if (!current) return null

  const availableOptions = OPTIONS.filter((o) => getOptionLabel(current, o) !== null)
  const isCurrentImportant = importantIds.has(current.id)

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 relative" onContextMenu={(e) => e.preventDefault()} style={{ userSelect: 'none' }}>
      {userName && <Watermark userName={userName} />}

      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6 text-sm flex-wrap">
        <span className="text-gray-500">{questions.length} questions</span>
        <span className="text-blue-600">{answeredCount} answered</span>
        <span className="text-green-600">{correctCount} correct</span>
        {importantIds.size > 0 && (
          <span className="text-amber-500">⭐ {importantIds.size} important</span>
        )}
        {answeredCount > 0 && (
          <span className="font-semibold text-gray-900 dark:text-white">{score}% score</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {importantIds.size > 0 && (
            <button
              onClick={() => { setShowImportantOnly(prev => !prev); setCurrentIndex(0) }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showImportantOnly
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              ⭐ {showImportantOnly ? 'Show all' : 'Important'}
            </button>
          )}
          <button
            onClick={() => setFinished(true)}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            Finish quiz
          </button>
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {displayQuestions.map((q, i) => {
          const answered = !!answers[q.id]
          const correct = answers[q.id] === q.correct_answer
          const isImportant = importantIds.has(q.id)
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-7 h-7 text-xs rounded-lg font-medium transition-colors relative',
                i === currentIndex ? 'ring-2 ring-blue-500 ring-offset-1' : '',
                !answered
                  ? isImportant
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  : correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
              )}
            >
              {i + 1}
              {isImportant && !answered && (
                <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      <div className={`bg-white dark:bg-gray-900 border-2 rounded-2xl p-6 mb-4 ${
        isCurrentImportant
          ? 'border-amber-300 dark:border-amber-700'
          : 'border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-xs text-gray-400">
            Question {currentIndex + 1} of {total}
            {showImportantOnly && ' · Important only'}
          </p>
          {user && (
            <button
              onClick={() => toggleImportant(current.id)}
              className={`text-lg flex-shrink-0 transition-all hover:scale-110 ${
                isCurrentImportant ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700 hover:text-amber-300'
              }`}
              title={isCurrentImportant ? 'Remove from important' : 'Mark as important'}
            >
              ⭐
            </button>
          )}
        </div>

        <p className="text-base font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
          {current.question}
        </p>

        <div className="space-y-2.5">
          {availableOptions.map((option) => {
            const label = getOptionLabel(current, option)
            if (!label) return null
            const answered = !!answers[current.id]
            const isCorrect = current.correct_answer === option
            return (
              <button
                key={option}
                onClick={() => handleAnswer(current.id, option)}
                disabled={answered}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors',
                  getOptionStyle(current, option)
                )}
              >
                <span className="font-semibold flex-shrink-0 w-5">{option}.</span>
                <span>{label}</span>
                {answered && isCorrect && <span className="ml-auto text-green-500">✓</span>}
                {answered && answers[current.id] === option && !isCorrect && (
                  <span className="ml-auto text-red-400">✗</span>
                )}
              </button>
            )
          })}
        </div>

        {showExplanation[current.id] && current.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Explanation</p>
            <p className="text-sm text-blue-900 dark:text-blue-200">{current.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentIndex((i) => Math.min(i + 1, total - 1))}
          disabled={currentIndex === total - 1}
          className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next question
        </button>
      </div>
    </div>
  )
}