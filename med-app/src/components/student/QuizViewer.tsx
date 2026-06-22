'use client'

import { useState, useEffect } from 'react'
import type { QuizQuestion } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import WatermarkOverlay from '@/components/common/WatermarkOverlay'
import ContentProtectionWrapper from '@/components/common/ContentProtectionWrapper'

interface QuizViewerProps {
  questions: QuizQuestion[]
  userName?: string
  lectureId?: string
  onStatsChange?: (stats: { total: number; answered: number; correct: number; current: number }) => void
}

const OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

export default function QuizViewer({ questions, userName, lectureId, onStatsChange }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)

  const current = questions[currentIndex]
  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const correctCount = questions.filter((q) => answers[q.id] === q.correct_answer).length
  const score = answeredCount > 0 ? Math.round((correctCount / total) * 100) : 0

  // Emit stats to parent whenever they change
  useEffect(() => {
    onStatsChange?.({
      total,
      answered: answeredCount,
      correct: correctCount,
      current: currentIndex + 1,
    })
  }, [currentIndex, answeredCount, correctCount, total])

  function handleAnswer(questionId: string, option: string) {
    if (answers[questionId]) return
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
    setShowExplanation((prev) => ({ ...prev, [questionId]: true }))
  }

  function getOptionLabel(q: QuizQuestion, option: string): string | null {
    const map: Record<string, string | null> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d, E: q.option_e }
    return map[option] ?? null
  }

  function getOptionStyle(q: QuizQuestion, option: string) {
    const selected = answers[q.id]
    const isCorrect = q.correct_answer === option
    const isSelected = selected === option
    const isAnswered = !!selected
    if (!isAnswered) return isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    if (isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100'
    if (isSelected && !isCorrect) return 'border-red-400 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'
    return 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600'
  }

  if (!current) return null

  if (finished) {
    return (
      <ContentProtectionWrapper className="max-w-xl mx-auto px-6 py-16 text-center relative">
        {userName && <WatermarkOverlay userName={userName} />}
        <div className="text-5xl font-bold text-blue-600 mb-2">{score}%</div>
        <p className="text-gray-500 mb-1">{correctCount} correct out of {total} questions</p>
        <button
          onClick={() => { setFinished(false); setCurrentIndex(0); setAnswers({}); setShowExplanation({}) }}
          className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
        >
          Retry quiz
        </button>
      </ContentProtectionWrapper>
    )
  }

  const availableOptions = OPTIONS.filter((o) => getOptionLabel(current, o) !== null)

  return (
    <ContentProtectionWrapper className="max-w-3xl mx-auto px-6 py-6 relative">
      {userName && <WatermarkOverlay userName={userName} />}

      <div className="flex items-center gap-6 mb-6 text-sm">
        <span className="text-gray-500">{total} questions</span>
        <span className="text-blue-600">{answeredCount} answered</span>
        <span className="text-green-600">{correctCount} correct</span>
        {answeredCount > 0 && <span className="font-semibold text-gray-900 dark:text-white">{score}% score</span>}
        <button
          onClick={() => setFinished(true)}
          className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
        >
          Finish quiz
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {questions.map((q, i) => {
          const answered = !!answers[q.id]
          const correct = answers[q.id] === q.correct_answer
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-7 h-7 text-xs rounded-lg font-medium transition-colors',
                i === currentIndex ? 'ring-2 ring-blue-500 ring-offset-1' : '',
                !answered ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-4">
        <p className="text-xs text-gray-400 mb-3">Question {currentIndex + 1} of {total}</p>
        <p className="text-base font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">{current.question}</p>
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
                className={cn('w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors', getOptionStyle(current, option))}
              >
                <span className="font-semibold flex-shrink-0 w-5">{option}.</span>
                <span>{label}</span>
                {answered && isCorrect && <span className="ml-auto text-green-500">✓</span>}
                {answered && answers[current.id] === option && !isCorrect && <span className="ml-auto text-red-400">✗</span>}
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
    </ContentProtectionWrapper>
  )
}