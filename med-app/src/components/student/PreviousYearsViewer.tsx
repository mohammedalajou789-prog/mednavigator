'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PreviousYearQuestion } from '@/types/database'
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

const EXAM_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  final: { bg: '#FEF2F2', text: '#DC2626' },
  midterm: { bg: '#EFF6FF', text: '#2563EB' },
  quiz: { bg: '#F0FDF4', text: '#16A34A' },
  practical: { bg: '#FDF4FF', text: '#9333EA' },
}

const OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const

export default function PreviousYearsViewer({ questions, userName, onStatsChange }: PreviousYearsViewerProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [importantIds, setImportantIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const years = [...new Set(questions.map(q => q.exam_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0))
  const types = [...new Set(questions.map(q => q.exam_type).filter(Boolean))]

  const filtered = questions.filter(q => {
    if (filterYear !== 'all' && String(q.exam_year) !== filterYear) return false
    if (filterType !== 'all' && q.exam_type !== filterType) return false
    return true
  })

  const current = filtered[currentIndex]
  const total = filtered.length
  const answeredCount = Object.keys(answers).length

  const { data: bookmarkData, isLoading: bookmarkLoading } = useQuery({
    queryKey: ['bookmarks', 'pyq', user?.id],
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
    onStatsChange?.({ total: questions.length, important: importantIds.size, answered: answeredCount })
  }, [importantIds.size, answeredCount, questions.length])

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0)
  }, [filterYear, filterType])

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
  }

  function getOptionStyle(q: PreviousYearQuestion, option: string): React.CSSProperties {
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

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <p style={{ fontSize: '14px', color: '#94A3B8' }}>No questions match the selected filters.</p>
      </div>
    )
  }

  if (!current) return null

  const options: string[] = Array.isArray(current.options)
    ? current.options.map((o: unknown) => {
        if (typeof o === 'string') return o
        if (o && typeof o === 'object' && 'text' in o) return (o as { text: string }).text
        return ''
      }).filter(Boolean)
    : []

  const isCurrentImportant = importantIds.has(current.id)
  const isAnswered = !!answers[current.id]
  const typeColor = EXAM_TYPE_COLORS[current.exam_type ?? ''] ?? { bg: '#F1F5F9', text: '#64748B' }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', padding: '8px clamp(16px, 3vw, 26px) 60px', userSelect: 'none', position: 'relative' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Watermark */}
      {userName && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden', pointerEvents: 'none', opacity: 0.04 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', fontSize: '13px', fontWeight: 500, color: '#1E293B', whiteSpace: 'nowrap', top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '100%', marginTop: '6px' }}>

        {/* Filters + stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'rgb(37,99,235)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {total} questions
          </span>

          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
            <option value="all">All years</option>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
            <option value="all">All types</option>
            {types.map(t => <option key={t} value={t ?? ''}>{EXAM_TYPE_LABELS[t ?? ''] ?? t}</option>)}
          </select>

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>{total} shown</span>
        </div>

        {/* Progress row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(51,65,85)', whiteSpace: 'nowrap' }}>
            Question {currentIndex + 1} of {total}
          </span>
          <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: 'rgb(231,234,241)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '99px', background: 'rgb(37,99,235)', transition: 'width 0.35s', width: `${Math.round((currentIndex / total) * 100)}%` }} />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(37,99,235)', whiteSpace: 'nowrap' }}>
            {answeredCount}/{total} answered
          </span>
        </div>

        {/* Question navigator grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}>
          {filtered.map((q, i) => {
            const ans = answers[q.id]
            const isCorrect = ans === q.correct_answer
            let bg = 'rgb(238,240,244)'; let color = 'rgb(100,116,139)'
            if (i === currentIndex) { bg = 'rgb(238,240,244)'; color = 'rgb(100,116,139)' }
            else if (ans && isCorrect) { bg = 'rgb(220,243,231)'; color = 'rgb(19,138,90)' }
            else if (ans && !isCorrect) { bg = 'rgb(251,220,218)'; color = 'rgb(220,72,66)' }
            else if (importantIds.has(q.id)) { bg = '#FEF3C7'; color = '#D97706' }
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: '32px', height: '32px', borderRadius: '9px',
                  border: i === currentIndex ? '2px solid rgb(37,99,235)' : '1px solid transparent',
                  background: bg, color,
                  fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                }}>
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Question card */}
        <div style={{
          background: 'linear-gradient(rgb(255,255,255) 0%, rgb(252,253,255) 100%)',
          borderRadius: '20px',
          border: `1px solid ${isCurrentImportant ? '#FCD34D' : 'rgb(236,238,243)'}`,
          padding: '28px 28px 24px',
          marginBottom: '16px',
          boxShadow: 'rgba(255,255,255,0.6) 0px 1px 0px inset, rgba(16,24,40,0.04) 0px 1px 2px, rgba(16,24,40,0.12) 0px 10px 20px -12px, rgba(37,99,235,0.18) 0px 26px 46px -28px',
        }}>
          {/* Question header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '7px', background: '#F1F5F9', color: '#64748B' }}>
                Q{currentIndex + 1}
              </span>
              {current.exam_year && (
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '7px', background: '#EEF6FF', color: '#2563EB' }}>
                  {current.exam_year}
                </span>
              )}
              {current.exam_type && (
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '7px', background: typeColor.bg, color: typeColor.text }}>
                  {EXAM_TYPE_LABELS[current.exam_type] ?? current.exam_type}
                </span>
              )}
            </div>
            {user && (
              <button
                onClick={() => toggleImportant(current.id)}
                title="Mark important"
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgb(226,232,240)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isCurrentImportant ? '#2563EB' : '#94A3B8', transition: 'transform 0.15s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            )}
          </div>

          {/* Question text */}
          <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5, marginBottom: '20px' }}>
            {current.question}
          </div>

          {/* Options */}
          {options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {options.map((opt, i) => {
                const label = OPTIONS[i]
                if (!label) return null
                const optStyle = getOptionStyle(current, label)
                const isCorrect = current.correct_answer === label
                const isSelected = answers[current.id] === label
                const letterBg = isAnswered && isCorrect ? 'rgb(19,138,90)' : isAnswered && isSelected ? 'rgb(220,72,66)' : '#F1F5F9'
                const letterColor = isAnswered && (isCorrect || isSelected) ? '#fff' : '#64748B'
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(current.id, label)}
                    disabled={isAnswered}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', borderRadius: '13px',
                      cursor: isAnswered ? 'default' : 'pointer',
                      textAlign: 'left', transition: 'background 0.15s, border-color 0.15s',
                      ...optStyle,
                    }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, background: letterBg, color: letterColor }}>
                      {label}
                    </span>
                    <span style={{ flex: 1, textAlign: 'left', fontSize: '14.5px', lineHeight: 1.5 }}>{opt}</span>
                    {isAnswered && isCorrect && (
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: 'rgb(19,138,90)', color: '#fff' }}>✓</span>
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: 'rgb(220,72,66)', color: '#fff' }}>✕</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Explanation */}
          {isAnswered && current.explanation && (
            <div style={{ marginTop: '18px', display: 'flex', gap: '12px', padding: '16px 18px', borderRadius: '14px', background: '#EEF3FF', border: '1px solid #DCE6FD' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#DCE6FD', color: '#2563EB', marginTop: '1px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#2563EB', marginBottom: '4px' }}>EXPLANATION</div>
                <div style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgb(60,70,97)' }}>{current.explanation}</div>
              </div>
            </div>
          )}
        </div>

        {/* Previous / Next buttons */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            style={{ flex: 1, height: '52px', borderRadius: '14px', border: '1px solid rgb(226,232,240)', background: '#fff', color: currentIndex === 0 ? '#CBD5E1' : 'rgb(71,85,105)', fontSize: '14px', fontWeight: 700, cursor: currentIndex === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.15s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex(i => i >= total - 1 ? 0 : i + 1)}
            style={{ flex: 2, height: '52px', borderRadius: '14px', border: 'none', background: 'rgb(37,99,235)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s' }}>
            {currentIndex >= total - 1 ? 'Back to first' : 'Next question'}
          </button>
        </div>

      </div>
    </div>
  )
}