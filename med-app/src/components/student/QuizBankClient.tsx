'use client'

import { useState, useMemo } from 'react'

interface QuizQuestion {
  id: string
  lecture_id: string
  question: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  option_e: string | null
  correct_answer: string | null
  explanation: string | null
  tags: string[] | null
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
  questions: QuizQuestion[]
  lectures: Lecture[]
  chapters: Chapter[]
  subSubjects: SubSubject[]
}

export default function QuizBankClient({ questions, lectures, chapters, subSubjects }: Props) {
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterLecture, setFilterLecture] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const groups = [...chapters, ...subSubjects]

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

  const lecturesInGroup = useMemo(() => {
    if (filterGroup === 'all') return lectures
    return lectures.filter(l => l.chapter_id === filterGroup || l.sub_subject_id === filterGroup)
  }, [filterGroup, lectures])

  const filtered = useMemo(() => {
    return questions.filter(q => {
      if (filterGroup !== 'all') {
        const lecture = lectures.find(l => l.id === q.lecture_id)
        if (!lecture) return false
        if (lecture.chapter_id !== filterGroup && lecture.sub_subject_id !== filterGroup) return false
      }
      if (filterLecture !== 'all' && q.lecture_id !== filterLecture) return false
      if (search.trim()) {
        if (!q.question.toLowerCase().includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [questions, filterGroup, filterLecture, search, lectures])

  function getOptions(q: QuizQuestion): { letter: string; text: string }[] {
    const opts: { letter: string; text: string }[] = []
    if (q.option_a) opts.push({ letter: 'A', text: q.option_a })
    if (q.option_b) opts.push({ letter: 'B', text: q.option_b })
    if (q.option_c) opts.push({ letter: 'C', text: q.option_c })
    if (q.option_d) opts.push({ letter: 'D', text: q.option_d })
    if (q.option_e) opts.push({ letter: 'E', text: q.option_e })
    return opts
  }

  function handleSelect(qId: string, letter: string) {
    if (revealed.has(qId)) return
    setSelected(prev => ({ ...prev, [qId]: letter }))
  }

  function handleReveal(qId: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.add(qId)
      return next
    })
  }

  function revealAll() {
    setRevealed(new Set(filtered.map(q => q.id)))
  }

  function resetAll() {
    setRevealed(new Set())
    setSelected({})
  }

  const answeredCount = filtered.filter(q => selected[q.id] !== undefined || revealed.has(q.id)).length
  const correctCount  = filtered.filter(q => revealed.has(q.id) && selected[q.id] === q.correct_answer).length

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>

      {/* Stats + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> question(s)
          </span>
          {answeredCount > 0 && (
            <span>
              <span className="font-semibold text-green-600">{correctCount}</span>
              <span> / {answeredCount} correct</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={revealAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reveal All
          </button>
          <button
            onClick={resetAll}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reset
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
            const options    = getOptions(q)
            const isRevealed = revealed.has(q.id)
            const userAnswer = selected[q.id]
            const lecture    = lectures.find(l => l.id === q.lecture_id)
            const groupName  = lecture ? lectureGroupMap[lecture.id] : null

            return (
              <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">

                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-400">Q{index + 1}</span>
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
                  {!isRevealed && (
                    <button
                      onClick={() => handleReveal(q.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Show Answer
                    </button>
                  )}
                  {isRevealed && (
                    <span className={
                      userAnswer === q.correct_answer
                        ? 'text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-medium'
                        : userAnswer
                          ? 'text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium'
                          : 'text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium'
                    }>
                      {userAnswer === q.correct_answer ? '✓ Correct' : userAnswer ? '✗ Incorrect' : 'Revealed'}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                  <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed font-medium">{q.question}</p>

                  {options.length > 0 && (
                    <div className="space-y-2">
                      {options.map(({ letter, text }) => {
                        const isCorrect  = q.correct_answer === letter
                        const isSelected = userAnswer === letter
                        let bg = 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                        let labelBg = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        let textColor = 'text-slate-700 dark:text-slate-300'
                        if (isRevealed && isCorrect) {
                          bg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          labelBg = 'bg-green-500 text-white'
                          textColor = 'text-green-800 dark:text-green-300 font-medium'
                        } else if (isRevealed && isSelected && !isCorrect) {
                          bg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          labelBg = 'bg-red-500 text-white'
                          textColor = 'text-red-800 dark:text-red-300'
                        } else if (!isRevealed && isSelected) {
                          bg = 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          labelBg = 'bg-blue-500 text-white'
                          textColor = 'text-blue-800 dark:text-blue-300 font-medium'
                        }
                        return (
                          <button
                            key={letter}
                            onClick={() => handleSelect(q.id, letter)}
                            disabled={isRevealed}
                            className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm border transition-colors text-left ${bg} ${isRevealed ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${labelBg}`}>
                              {letter}
                            </span>
                            <span className={textColor}>{text}</span>
                            {isRevealed && isCorrect && (
                              <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">✓ Correct</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

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
