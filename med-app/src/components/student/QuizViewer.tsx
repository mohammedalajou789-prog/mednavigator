'use client'

import { useState, useEffect } from 'react'
import type { QuizQuestion } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

interface QuizViewerProps {
  questions: QuizQuestion[]
  userName?: string
  lectureId?: string
  onStatsChange?: (stats: { total: number; answered: number; correct: number; current: number; important: number }) => void
}

const OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

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

  const displayQuestions = showImportantOnly ? questions.filter(q => importantIds.has(q.id)) : questions
  const current = displayQuestions[currentIndex]
  const total = displayQuestions.length
  const answeredCount = Object.keys(answers).length
  const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase.from('bookmarks').select('question_id').eq('user_id', user!.id).eq('bookmark_type', 'question').not('question_id', 'is', null)
      if (data) setImportantIds(new Set(data.map((b: { question_id: string }) => b.question_id)))
      setLoading(false)
    }
    load()
  }, [user])

  useEffect(() => {
    onStatsChange?.({ total: questions.length, answered: answeredCount, correct: correctCount, current: currentIndex + 1, important: importantIds.size })
  }, [currentIndex, answeredCount, correctCount, importantIds.size, questions.length])

  async function toggleImportant(questionId: string) {
    if (!user) return
    if (importantIds.has(questionId)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', questionId).eq('bookmark_type', 'question')
      setImportantIds(prev => { const n = new Set(prev); n.delete(questionId); return n })
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, question_id: questionId, bookmark_type: 'question' })
      setImportantIds(prev => new Set([...prev, questionId]))
    }
  }

  function handleAnswer(questionId: string, option: string) {
    if (answers[questionId]) return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
    setShowExplanation(prev => ({ ...prev, [questionId]: true }))
  }

  function getOptionLabel(q: QuizQuestion, option: string): string | null {
    const map: Record<string, string | null> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d, E: q.option_e }
    return map[option] ?? null
  }

  function getOptionStyle(q: QuizQuestion, option: string): React.CSSProperties {
    const selected = answers[q.id]
    const isCorrect = q.correct_answer === option
    const isSelected = selected === option
    const isAnswered = !!selected
    if (!isAnswered) return { border: '1.5px solid #E2E8F0', background: '#fff', color: '#374151' }
    if (isCorrect) return { border: '1.5px solid #16A34A', background: '#F0FDF4', color: '#14532D' }
    if (isSelected && !isCorrect) return { border: '1.5px solid #DC2626', background: '#FEF2F2', color: '#7F1D1D' }
    return { border: '1.5px solid #F1F5F9', background: '#F8FAFC', color: '#94A3B8' }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    )
  }

  if (finished) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 24px', textAlign: 'center', userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
        {userName && <Watermark userName={userName} />}
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: score >= 70 ? '#F0FDF4' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color: score >= 70 ? '#16A34A' : '#DC2626' }}>{score}%</span>
        </div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>
          {score >= 70 ? 'Great job!' : 'Keep practicing!'}
        </p>
        <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px' }}>{correctCount} correct out of {questions.length} questions</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setFinished(false); setCurrentIndex(0); setAnswers({}); setShowExplanation({}) }}
            style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Retry quiz
          </button>
          {importantIds.size > 0 && (
            <button
              onClick={() => { setFinished(false); setCurrentIndex(0); setAnswers({}); setShowExplanation({}); setShowImportantOnly(true) }}
              style={{ padding: '10px 24px', background: '#FFF7ED', color: '#D97706', borderRadius: '12px', border: '1px solid #FDE68A', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              ⭐ Review important
            </button>
          )}
        </div>
      </div>
    )
  }

  if (showImportantOnly && displayQuestions.length === 0) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>No important questions yet</p>
        <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>Mark questions as important while reviewing</p>
        <button onClick={() => setShowImportantOnly(false)} style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Show all questions
        </button>
      </div>
    )
  }

  if (!current) return null
  const availableOptions = OPTIONS.filter(o => getOptionLabel(current, o) !== null)
  const isCurrentImportant = importantIds.has(current.id)

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px 80px', userSelect: 'none', position: 'relative' }} onContextMenu={e => e.preventDefault()}>
      {userName && <Watermark userName={userName} />}

      {/* Stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <StatBadge label={`${questions.length} questions`} color="#EFF6FF" text="#2563EB" />
        <StatBadge label={`${answeredCount} answered`} color="#F0FDF4" text="#16A34A" />
        <StatBadge label={`${correctCount} correct`} color="#F0FDF4" text="#16A34A" />
        {answeredCount > 0 && <StatBadge label={`${score}% score`} color="#EFF6FF" text="#2563EB" />}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {importantIds.size > 0 && (
            <button
              onClick={() => { setShowImportantOnly(p => !p); setCurrentIndex(0) }}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: showImportantOnly ? '#F59E0B' : '#FFFBEB', color: showImportantOnly ? '#fff' : '#D97706' }}>
              ⭐ {showImportantOnly ? 'All' : 'Important'}
            </button>
          )}
          <button
            onClick={() => setFinished(true)}
            style={{ padding: '6px 16px', background: '#2563EB', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Finish
          </button>
        </div>
      </div>

      {/* Question navigator */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
        {displayQuestions.map((q, i) => {
          const answered = !!answers[q.id]
          const correct = answers[q.id] === q.correct_answer
          const isImportant = importantIds.has(q.id)
          let bg = '#F1F5F9'; let color = '#64748B'
          if (i === currentIndex) { bg = '#2563EB'; color = '#fff' }
          else if (answered && correct) { bg = '#16A34A'; color = '#fff' }
          else if (answered && !correct) { bg = '#DC2626'; color = '#fff' }
          else if (isImportant) { bg = '#FEF3C7'; color = '#D97706' }
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: i === currentIndex ? '2px solid #2563EB' : '1px solid transparent', background: bg, color, fontSize: '11px', fontWeight: 700, cursor: 'pointer', position: 'relative', transition: 'all 0.15s' }}>
              {i + 1}
              {isImportant && !answered && <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '8px' }}>⭐</span>}
            </button>
          )
        })}
      </div>

      {/* Question card */}
      <div style={{
        background: '#fff', borderRadius: '20px',
        border: `2px solid ${isCurrentImportant ? '#FCD34D' : '#E2E8F0'}`,
        padding: '24px', marginBottom: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px' }}>
              Question {currentIndex + 1}/{total}
            </span>
            {showImportantOnly && <span style={{ fontSize: '11px', color: '#D97706' }}>⭐ Important only</span>}
          </div>
          {user && (
            <button
              onClick={() => toggleImportant(current.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', flexShrink: 0, lineHeight: 1, transition: 'transform 0.15s' }}>
              {isCurrentImportant ? '⭐' : '☆'}
            </button>
          )}
        </div>

        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '20px', lineHeight: 1.6 }}>
          {current.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableOptions.map(option => {
            const label = getOptionLabel(current, option)
            if (!label) return null
            const answered = !!answers[current.id]
            const isCorrect = current.correct_answer === option
            const isSelected = answers[current.id] === option
            return (
              <button
                key={option}
                onClick={() => handleAnswer(current.id, option)}
                disabled={answered}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '12px', cursor: answered ? 'default' : 'pointer',
                  textAlign: 'left', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',
                  ...getOptionStyle(current, option),
                }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: isCorrect && answered ? '#16A34A' : isSelected && !isCorrect && answered ? '#DC2626' : '#F1F5F9', color: (isCorrect && answered) || (isSelected && answered) ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  {option}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {answered && isCorrect && <span style={{ color: '#16A34A', fontSize: '16px' }}>✓</span>}
                {answered && isSelected && !isCorrect && <span style={{ color: '#DC2626', fontSize: '16px' }}>✗</span>}
              </button>
            )
          })}
        </div>

        {showExplanation[current.id] && current.explanation && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Explanation</p>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#1E3A8A', lineHeight: 1.6 }}>{current.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer', opacity: currentIndex === 0 ? 0.4 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>
        <button
          onClick={() => setCurrentIndex(i => Math.min(i + 1, total - 1))}
          disabled={currentIndex === total - 1}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer', opacity: currentIndex === total - 1 ? 0.4 : 1 }}>
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

function StatBadge({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <span style={{ padding: '4px 10px', borderRadius: '20px', background: color, color: text, fontSize: '12px', fontWeight: 600 }}>
      {label}
    </span>
  )
}

function Watermark({ userName }: { userName: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden', pointerEvents: 'none', opacity: 0.04 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', fontSize: '13px', fontWeight: 500, color: '#1E293B', whiteSpace: 'nowrap', top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
          {userName}
        </div>
      ))}
    </div>
  )
}