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

export default function PreviousYearsViewer({ questions, userName, onStatsChange }: PreviousYearsViewerProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [importantIds, setImportantIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const years = [...new Set(questions.map(q => q.exam_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0))
  const types = [...new Set(questions.map(q => q.exam_type).filter(Boolean))]

  const filtered = questions.filter(q => {
    if (filterYear !== 'all' && String(q.exam_year) !== filterYear) return false
    if (filterType !== 'all' && q.exam_type !== filterType) return false
    if (showImportantOnly && !importantIds.has(q.id)) return false
    return true
  })

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
    onStatsChange?.({ total: questions.length, important: importantIds.size, answered: Object.keys(answers).length })
  }, [importantIds.size, Object.keys(answers).length, questions.length])

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px 80px', userSelect: 'none', position: 'relative' }} onContextMenu={e => e.preventDefault()}>
      {userName && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden', pointerEvents: 'none', opacity: 0.04 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', fontSize: '13px', fontWeight: 500, color: '#1E293B', whiteSpace: 'nowrap', top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 600 }}>
          {questions.length} questions
        </span>
        {importantIds.size > 0 && (
          <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#FFFBEB', color: '#D97706', fontSize: '12px', fontWeight: 600 }}>
            ⭐ {importantIds.size} important
          </span>
        )}
        {Object.keys(answers).length > 0 && (
          <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: 600 }}>
            {Object.keys(answers).length} answered
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All years</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All types</option>
          {types.map(t => <option key={t} value={t ?? ''}>{EXAM_TYPE_LABELS[t ?? ''] ?? t}</option>)}
        </select>

        {importantIds.size > 0 && (
          <button
            onClick={() => setShowImportantOnly(p => !p)}
            style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: showImportantOnly ? '#F59E0B' : '#FFFBEB', color: showImportantOnly ? '#fff' : '#D97706' }}>
            ⭐ {showImportantOnly ? 'Show all' : 'Important only'}
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{filtered.length} shown</span>
      </div>

      {/* Questions */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          {showImportantOnly ? (
            <>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>No important questions yet</p>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>Mark questions as important while reviewing</p>
              <button onClick={() => setShowImportantOnly(false)} style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Show all questions
              </button>
            </>
          ) : (
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>No questions match the selected filters.</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((q, index) => {
            const options = Array.isArray(q.options) ? q.options as string[] : []
            const optionLabels = ['A', 'B', 'C', 'D', 'E']
            const selected = answers[q.id]
            const answered = !!selected
            const isImportant = importantIds.has(q.id)
            const typeColor = EXAM_TYPE_COLORS[q.exam_type ?? ''] ?? { bg: '#F1F5F9', text: '#64748B' }

            return (
              <div
                key={q.id}
                style={{
                  background: '#fff', borderRadius: '18px',
                  border: `2px solid ${isImportant ? '#FCD34D' : '#E2E8F0'}`,
                  padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#64748B' }}>
                      Q{index + 1}
                    </span>
                    {q.exam_year && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB' }}>
                        {q.exam_year}
                      </span>
                    )}
                    {q.exam_type && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: typeColor.bg, color: typeColor.text }}>
                        {EXAM_TYPE_LABELS[q.exam_type] ?? q.exam_type}
                      </span>
                    )}
                  </div>
                  {user && (
                    <button
                      onClick={() => toggleImportant(q.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', flexShrink: 0, lineHeight: 1, transition: 'transform 0.15s' }}>
                      {isImportant ? '⭐' : '☆'}
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '14px', lineHeight: 1.6 }}>
                  {q.question}
                </p>

                {options.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {options.map((opt, i) => {
                      const label = optionLabels[i]
                      const isCorrect = q.correct_answer === label
                      const isSelected = selected === label
                      let borderColor = '#E2E8F0'; let bg = '#fff'; let color = '#374151'
                      if (answered) {
                        if (isCorrect) { borderColor = '#16A34A'; bg = '#F0FDF4'; color = '#14532D' }
                        else if (isSelected) { borderColor = '#DC2626'; bg = '#FEF2F2'; color = '#7F1D1D' }
                        else { borderColor = '#F1F5F9'; bg = '#F8FAFC'; color = '#94A3B8' }
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(q.id, label)}
                          disabled={answered}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', borderRadius: '10px',
                            border: `1.5px solid ${borderColor}`, background: bg, color,
                            fontSize: '13px', fontWeight: 500, cursor: answered ? 'default' : 'pointer',
                            textAlign: 'left', transition: 'all 0.15s',
                          }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: isCorrect && answered ? '#16A34A' : isSelected && answered ? '#DC2626' : '#F1F5F9', color: answered && (isCorrect || isSelected) ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                            {label}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {answered && isCorrect && <span style={{ color: '#16A34A' }}>✓</span>}
                          {answered && isSelected && !isCorrect && <span style={{ color: '#DC2626' }}>✗</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {answered && q.explanation && (
                  <div style={{ padding: '12px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', marginTop: '8px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Explanation</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#1E3A8A', lineHeight: 1.6 }}>{q.explanation}</p>
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