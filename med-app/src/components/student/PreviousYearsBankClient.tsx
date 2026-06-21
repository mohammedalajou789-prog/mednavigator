'use client'

import { useState, useMemo } from 'react'

interface Question {
  id: string
  lecture_id: string
  question: string
  options: unknown
  correct_answer: string | null
  explanation: string | null
  exam_year: number | null
  exam_type: string | null
}

interface Lecture {
  id: string
  title: string
  chapter_id: string | null
  sub_subject_id: string | null
}

interface Chapter {
  id: string
  title: string
}

interface SubSubject {
  id: string
  title: string
}

interface Props {
  questions: Question[]
  lectures: Lecture[]
  chapters: Chapter[]
  subSubjects: SubSubject[]
}

function getOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((o: unknown) => {
      if (typeof o === 'string') return o
      if (typeof o === 'object' && o !== null && 'text' in o) return String((o as { text: string }).text)
      return ''
    }).filter(Boolean)
  }
  return []
}

export default function PreviousYearsBankClient({ questions, lectures, chapters, subSubjects }: Props) {
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterLecture, setFilterLecture] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  // Build unique filter options
  const years = useMemo(() =>
    [...new Set(questions.map(q => q.exam_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0)),
    [questions]
  )

  const types = useMemo(() =>
    [...new Set(questions.map(q => q.exam_type).filter(Boolean))],
    [questions]
  )

  const groups = [...chapters, ...subSubjects]

  // Lecture ID → group title map
  const lectureGroupMap = useMemo(() => {
    const map: Record<string, string> = {}
    lectures.forEach(l => {
      if (l.chapter_id) {
        const ch = chapters.find(c => c.id === l.chapter_id)
        if (ch) map[l.id] = ch.title
      } else if (l.sub_subject_id) {
        const ss = subSubjects.find(s => s.id === l.sub_subject_id)
        if (ss) map[l.id] = ss.title
      }
    })
    return map
  }, [lectures, chapters, subSubjects])

  // Lectures in selected group
  const lecturesInGroup = useMemo(() => {
    if (filterGroup === 'all') return lectures
    return lectures.filter(l => l.chapter_id === filterGroup || l.sub_subject_id === filterGroup)
  }, [filterGroup, lectures])

  // Filtered questions
  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (filterYear !== 'all' && String(q.exam_year) !== filterYear) return false
      if (filterType !== 'all' && q.exam_type !== filterType) return false
      if (filterGroup !== 'all') {
        const lecture = lectures.find(l => l.id === q.lecture_id)
        if (!lecture) return false
        if (lecture.chapter_id !== filterGroup && lecture.sub_subject_id !== filterGroup) return false
      }
      if (filterLecture !== 'all' && q.lecture_id !== filterLecture) return false
      if (search.trim()) {
        const s = search.toLowerCase()
        if (!q.question.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [questions, filterYear, filterType, filterGroup, filterLecture, search, lectures])

  function toggleReveal(id: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function revealAll() {
    setRevealed(new Set(filtered.map(q => q.id)))
  }

  function hideAll() {
    setRevealed(new Set())
  }

  const examTypeLabel: Record<string, string> = {
    final: 'Final',
    midterm: 'Midterm',
    quiz: 'Quiz',
    practical: 'Practical',
  }

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</p>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Group filter */}
          {groups.length > 0 && (
            <select
              value={filterGroup}
              onChange={e => { setFilterGroup(e.target.value); setFilterLecture('all') }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Chapters</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          )}

          {/* Lecture filter */}
          <select
            value={filterLecture}
            onChange={e => setFilterLecture(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Lectures</option>
            {lecturesInGroup.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>

          {/* Year filter */}
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Years</option>
            {years.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {types.map(t => (
              <option key={t} value={t ?? ''}>{examTypeLabel[t ?? ''] ?? t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> question(s)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={revealAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reveal All
          </button>
          <button
            onClick={hideAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hide All
          </button>
        </div>
      </div>

      {/* Questions */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          No questions match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, index) => {
            const options = getOptions(q.options)
            const isRevealed = revealed.has(q.id)
            const lecture = lectures.find(l => l.id === q.lecture_id)
            const groupName = lecture ? lectureGroupMap[lecture.id] : null

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                {/* Question header */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-400">Q{index + 1}</span>
                    {q.exam_year && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {q.exam_year}
                      </span>
                    )}
                    {q.exam_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {examTypeLabel[q.exam_type] ?? q.exam_type}
                      </span>
                    )}
                    {groupName && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {groupName}
                      </span>
                    )}
                    {lecture && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                        {lecture.title}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleReveal(q.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isRevealed
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isRevealed ? 'Hide Answer' : 'Show Answer'}
                  </button>
                </div>

                {/* Question body */}
                <div className="px-5 py-4 space-y-4">
                  <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed font-medium">
                    {q.question}
                  </p>

                  {options.length > 0 && (
                    <div className="space-y-2">
                      {options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i)
                        const isCorrect = q.correct_answer === letter
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              isRevealed && isCorrect
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isRevealed && isCorrect
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {letter}
                            </span>
                            <span className={`${
                              isRevealed && isCorrect
                                ? 'text-green-800 dark:text-green-300 font-medium'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {opt}
                            </span>
                            {isRevealed && isCorrect && (
                              <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Explanation */}
                  {isRevealed && q.explanation && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Explanation</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}