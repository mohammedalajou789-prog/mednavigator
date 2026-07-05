'use client'

import { useState, useMemo } from 'react'

interface Flashcard {
  id: string
  lecture_id: string
  front_text: string
  back_text: string
  tags: string[] | null
  display_order: number | null
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
  cards: Flashcard[]
  lectures: Lecture[]
  chapters: Chapter[]
  subSubjects: SubSubject[]
}

export default function FlashcardsBankClient({ cards, lectures, chapters, subSubjects }: Props) {
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterLecture, setFilterLecture] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mode, setMode] = useState<'browse' | 'study'>('browse')

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
    return cards.filter(c => {
      if (filterGroup !== 'all') {
        const lecture = lectures.find(l => l.id === c.lecture_id)
        if (!lecture) return false
        if (lecture.chapter_id !== filterGroup && lecture.sub_subject_id !== filterGroup) return false
      }
      if (filterLecture !== 'all' && c.lecture_id !== filterLecture) return false
      if (search.trim()) {
        const s = search.toLowerCase()
        if (!c.front_text.toLowerCase().includes(s) && !c.back_text.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [cards, filterGroup, filterLecture, search, lectures])

  function toggleFlip(id: string) {
    setFlipped(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function resetFlipped() {
    setFlipped(new Set())
    setCurrentIndex(0)
  }

  const currentCard = filtered[currentIndex]

  return (
    <div className="space-y-6">

      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setMode('browse'); resetFlipped() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'browse' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          Browse All
        </button>
        <button
          onClick={() => { setMode('study'); resetFlipped() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'study' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          Study Mode
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</p>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentIndex(0) }}
          placeholder="Search flashcards..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="grid grid-cols-2 gap-3">
          {groups.length > 0 && (
            <select
              value={filterGroup}
              onChange={e => { setFilterGroup(e.target.value); setFilterLecture('all'); setCurrentIndex(0) }}
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
            onChange={e => { setFilterLecture(e.target.value); setCurrentIndex(0) }}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Lectures</option>
            {lecturesInGroup.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> card(s)
        </p>
        {mode === 'browse' && (
          <button
            onClick={() => setFlipped(new Set(filtered.map(c => c.id)))}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Flip All
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          No flashcards match your filters.
        </div>
      ) : mode === 'study' ? (
        /* ── Study Mode ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{currentIndex + 1} / {filtered.length}</span>
            <button onClick={resetFlipped} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Reset</button>
          </div>

          {currentCard && (
            <div
              onClick={() => toggleFlip(currentCard.id)}
              className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl min-h-[220px] flex flex-col items-center justify-center p-8 text-center select-none hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              {!flipped.has(currentCard.id) ? (
                <>
                  <p className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-widest">Question</p>
                  <p className="text-slate-800 dark:text-slate-100 text-base font-medium leading-relaxed">{currentCard.front_text}</p>
                  <p className="text-xs text-slate-400 mt-6">Tap to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-green-500 mb-4 uppercase tracking-widest">Answer</p>
                  <p className="text-slate-800 dark:text-slate-100 text-base leading-relaxed">{currentCard.back_text}</p>
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setFlipped(new Set()) }}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => { setCurrentIndex(i => Math.min(filtered.length - 1, i + 1)); setFlipped(new Set()) }}
              disabled={currentIndex === filtered.length - 1}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        /* ── Browse Mode ── */
        <div className="space-y-3">
          {filtered.map((card, index) => {
            const isFlipped   = flipped.has(card.id)
            const lecture     = lectures.find(l => l.id === card.lecture_id)
            const groupName   = lecture ? lectureGroupMap[lecture.id] : null
            return (
              <div
                key={card.id}
                onClick={() => toggleFlip(card.id)}
                className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                  {groupName && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{groupName}</span>
                  )}
                  {lecture && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{lecture.title}</span>
                  )}
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${isFlipped ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {isFlipped ? 'Answer' : 'Question'}
                  </span>
                </div>
                <div className="px-5 py-4">
                  {!isFlipped ? (
                    <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed font-medium">{card.front_text}</p>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{card.back_text}</p>
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
