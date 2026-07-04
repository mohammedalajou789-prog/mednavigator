'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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

  const { data: bookmarkData, isLoading: bookmarkLoading } = useQuery({
    queryKey: ['bookmarks', 'question', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('question_id')
        .eq('user_id', user!.id)
        .eq('bookmark_type', 'question')
        .not('question_id', 'is', null)
      return data ?? []
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (bookmarkLoading) return
    if (bookmarkData) {
      setImportantIds(new Set(bookmarkData.map((b: { question_id: string }) => b.question_id)))
    }
    setLoading(false)
  }, [bookmarkData, bookmarkLoading])

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
    if (!isAnswered) return { border: '1.5px solid rgb(226,232,240)', background: '#fff', color: 'rgb(15,23,42)' }
    if (isCorrect) return { border: '1.5px solid rgb(184,237,211)', background: 'rgb(238,249,242)', color: 'rgb(19,138,90)' }
    if (isSelected && !isCorrect) return { border: '1.5px solid rgb(250,215,211)', background: 'rgb(255,244,243)', color: 'rgb(220,72,66)' }
    return { border: '1.5px solid rgb(226,232,240)', background: '#fff', color: 'rgb(15,23,42)' }
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px clamp(16px, 3vw, 26px) 60px', userSelect: 'none', position: 'relative' }} onContextMenu={e => e.preventDefault()}>
      {userName && <Watermark userName={userName} />}

      <div style={{ width: '100%', maxWidth: '100%', marginTop: '6px' }}>

        {/* Stats bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginBottom: '14px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(22,163,74)' }}>{correctCount} correct</span>
          <button
            onClick={() => setFinished(true)}
            style={{ height: '32px', padding: '0 14px', borderRadius: '9px', border: 'none', background: 'rgb(15,23,42)', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
            Finish
          </button>
        </div>

        {/* Progress row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(51,65,85)', whiteSpace: 'nowrap' }}>Question {currentIndex + 1} of {total}</span>
          <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: 'rgb(231,234,241)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: 'rgb(37,99,235)', transition: 'width 0.35s', width: `${Math.round((currentIndex / total) * 100)}%` }} />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(37,99,235)', whiteSpace: 'nowrap' }}>{answeredCount}/{total} answered</span>
        </div>

        {/* Question navigator */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}>
          {displayQuestions.map((q, i) => {
            const answered = !!answers[q.id]
            const correct = answers[q.id] === q.correct_answer
            const isImportant = importantIds.has(q.id)
            let bg = 'rgb(238,240,244)'; let color = 'rgb(100,116,139)'
            if (i === currentIndex) { bg = 'rgb(238,240,244)'; color = 'rgb(100,116,139)' }
            else if (answered && correct) { bg = 'rgb(220,243,231)'; color = 'rgb(19,138,90)' }
            else if (answered && !correct) { bg = 'rgb(251,220,218)'; color = 'rgb(220,72,66)' }
            else if (isImportant) { bg = '#FEF3C7'; color = '#D97706' }
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                style={{ width: '32px', height: '32px', borderRadius: '9px', border: i === currentIndex ? '2px solid rgb(37,99,235)' : 'transparent', background: bg, color, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', position: 'relative', transition: 'all 0.15s' }}>
                {i + 1}
                {isImportant && !answered && <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '8px' }}>⭐</span>}
              </button>
            )
          })}
        </div>

        {/* Question card */}
        <div style={{
          background: 'linear-gradient(rgb(255,255,255) 0%,rgb(252,253,255) 100%)',
          borderRadius: '20px',
          border: `1px solid ${isCurrentImportant ? '#FCD34D' : 'rgb(236,238,243)'}`,
          padding: '28px 28px 24px',
          marginBottom: '16px',
          boxShadow: 'rgba(255,255,255,0.6) 0px 1px 0px inset,rgba(16,24,40,0.04) 0px 1px 2px,rgba(16,24,40,0.12) 0px 10px 20px -12px,rgba(37,99,235,0.18) 0px 26px 46px -28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', minWidth: 0 }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '30px', height: '30px', padding: '0 9px', borderRadius: '9px', background: 'rgb(238,243,255)', color: 'rgb(37,99,235)', fontSize: '12.5px', fontWeight: 800, marginTop: '1px' }}>
                Q{currentIndex + 1}
              </span>
              <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>
                {current.question}
              </div>
            </div>
            {user && (
              <button
                onClick={() => toggleImportant(current.id)}
                title="Mark important"
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgb(226,232,240)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isCurrentImportant ? '#2563EB' : '#94A3B8', transition: 'transform 0.15s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    padding: '14px 16px', borderRadius: '13px', cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left', transition: 'background 0.15s, border-color 0.15s, transform 0.12s',
                    ...getOptionStyle(current, option),
                  }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, background: isCorrect && answered ? 'rgb(19,138,90)' : isSelected && !isCorrect && answered ? 'rgb(220,72,66)' : 'rgb(241,245,249)', color: (isCorrect && answered) || (isSelected && answered) ? '#fff' : 'rgb(100,116,139)' }}>
                    {option}
                  </span>
                  <span style={{ flex: 1, fontSize: '14.5px', lineHeight: 1.5 }}>{label}</span>
                  {answered && isCorrect && (
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: 'rgb(19,138,90)', color: '#fff' }}>✓</span>
                  )}
                  {answered && isSelected && !isCorrect && (
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: 'rgb(220,72,66)', color: '#fff' }}>✕</span>
                  )}
                </button>
              )
            })}
          </div>

          {showExplanation[current.id] && current.explanation && (
            <div style={{ marginTop: '18px', display: 'flex', gap: '12px', padding: '16px 18px', borderRadius: '14px', background: 'rgb(238,243,255)', border: '1px solid rgb(220,230,253)' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(220,230,253)', color: 'rgb(37,99,235)', marginTop: '1px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'rgb(37,99,235)', marginBottom: '4px', textTransform: 'uppercase' }}>EXPLANATION</div>
                <div style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgb(60,70,97)' }}>{current.explanation}</div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '18px' }}>
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            style={{ flex: 1, height: '52px', borderRadius: '14px', border: '1px solid rgb(226,232,240)', background: '#fff', color: 'rgb(71,85,105)', fontSize: '14px', fontWeight: 700, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: currentIndex === 0 ? 0.45 : 1, transition: 'transform 0.15s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex(i => Math.min(i + 1, total - 1))}
            disabled={currentIndex === total - 1}
            style={{ flex: 2, height: '52px', borderRadius: '14px', border: 'none', background: 'rgb(37,99,235)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: currentIndex === total - 1 ? 'not-allowed' : 'pointer', transition: 'transform 0.15s' }}>
            Next question
          </button>
        </div>

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