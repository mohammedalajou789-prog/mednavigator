'use client'

import { useState, useEffect } from 'react'
import type { Flashcard } from '@/types/database'
import MNRenderer from '@/components/student/MNRenderer'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

interface FlashcardsViewerProps {
  flashcards: Flashcard[]
  userName?: string
  onStatsChange?: (stats: {
    total: number
    important: number
    current: number
    easy: number
    medium: number
    hard: number
  }) => void
}

export default function FlashcardsViewer({ flashcards, userName, onStatsChange }: FlashcardsViewerProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cards, setCards] = useState(flashcards)
  const [importantIds, setImportantIds] = useState<Set<string>>(new Set())
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  const displayCards = showImportantOnly
    ? cards.filter(c => importantIds.has(c.id))
    : cards

  const current = displayCards[currentIndex]
  const total = displayCards.length
  const importantCount = importantIds.size

  // Load important bookmarks from Supabase
  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('bookmarks')
        .select('flashcard_id')
        .eq('user_id', user!.id)
        .eq('bookmark_type', 'flashcard')
        .not('flashcard_id', 'is', null)
      if (data) {
        setImportantIds(new Set(data.map((b: { flashcard_id: string }) => b.flashcard_id)))
      }
      setLoading(false)
    }
    load()
  }, [user])

  // Emit stats
  useEffect(() => {
    onStatsChange?.({
      total,
      important: importantCount,
      current: currentIndex + 1,
      easy: 0,
      medium: 0,
      hard: 0,
    })
  }, [currentIndex, total, importantCount])

  async function toggleImportant(cardId: string) {
    if (!user) return
    if (importantIds.has(cardId)) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id)
        .eq('flashcard_id', cardId)
        .eq('bookmark_type', 'flashcard')
      setImportantIds(prev => { const n = new Set(prev); n.delete(cardId); return n })
    } else {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        flashcard_id: cardId,
        bookmark_type: 'flashcard',
      })
      setImportantIds(prev => new Set([...prev, cardId]))
    }
  }

  function handleShuffle() {
    setCards([...cards].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setFlipped(false)
  }

  function handleNext() {
    setFlipped(false)
    setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, total - 1)), 150)
  }

  function handlePrev() {
    setFlipped(false)
    setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 150)
  }

  function handleToggleImportantFilter() {
    setShowImportantOnly(prev => !prev)
    setCurrentIndex(0)
    setFlipped(false)
  }

  function renderContent(text: string) {
    if (text.includes('[') && text.includes(']')) {
      return <MNRenderer content={text} showWatermark={false} />
    }
    return (
      <p className="text-base text-gray-800 dark:text-gray-200 text-center leading-relaxed">
        {text}
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showImportantOnly && displayCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-4xl mb-4">⭐</p>
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No important cards yet</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">
          Mark cards as important by clicking the ⭐ button while reviewing.
        </p>
        <button
          onClick={handleToggleImportantFilter}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Show all cards
        </button>
      </div>
    )
  }

  if (!current) return null

  const isCurrentImportant = importantIds.has(current.id)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 relative" onContextMenu={(e) => e.preventDefault()} style={{ userSelect: 'none' }}>
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

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Card {currentIndex + 1} of {total}
            {showImportantOnly && (
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⭐ Important only
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {importantCount} important card{importantCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {importantCount > 0 && (
            <button
              onClick={handleToggleImportantFilter}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showImportantOnly
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              ⭐ {showImportantOnly ? 'Show all' : 'Important'}
            </button>
          )}
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Shuffle
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className={`relative bg-white dark:bg-gray-900 border-2 rounded-2xl min-h-[260px] p-8 cursor-pointer mb-4 transition-all ${
          isCurrentImportant
            ? 'border-amber-300 dark:border-amber-700'
            : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
        }`}
        onClick={() => setFlipped(!flipped)}
      >
        {/* Important star button */}
        {user && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleImportant(current.id) }}
            className={`absolute top-4 right-4 text-lg transition-all hover:scale-110 ${
              isCurrentImportant ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700 hover:text-amber-300'
            }`}
            title={isCurrentImportant ? 'Remove from important' : 'Mark as important'}
          >
            ⭐
          </button>
        )}

        <span className="absolute top-4 left-4 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          {flipped ? 'Answer' : 'Question'}
        </span>

        <div className="mt-6 flex flex-col items-center justify-center min-h-[160px]">
          {renderContent(flipped ? current.back_text : current.front_text)}
        </div>

        {!flipped && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
            Click to reveal answer
          </p>
        )}
      </div>

      {/* Mark important hint */}
      {!isCurrentImportant && user && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mb-4">
          Tap ⭐ to mark this card as important
        </p>
      )}
      {isCurrentImportant && (
        <p className="text-center text-xs text-amber-500 dark:text-amber-400 mb-4">
          ⭐ Marked as important
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setFlipped(!flipped)}
          className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Flip
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}