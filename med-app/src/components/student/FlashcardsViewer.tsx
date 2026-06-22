'use client'

import { useState, useEffect } from 'react'
import type { Flashcard } from '@/types/database'
import WatermarkOverlay from '@/components/common/WatermarkOverlay'
import ContentProtectionWrapper from '@/components/common/ContentProtectionWrapper'
import MNRenderer from '@/components/student/MNRenderer'

interface FlashcardsViewerProps {
  flashcards: Flashcard[]
  userName?: string
  onStatsChange?: (stats: { total: number; easy: number; medium: number; hard: number; current: number }) => void
}

export default function FlashcardsViewer({ flashcards, userName, onStatsChange }: FlashcardsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cards, setCards] = useState(flashcards)
  const [ratings, setRatings] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({})

  const current = cards[currentIndex]
  const total = cards.length
  const easyCount = Object.values(ratings).filter((r) => r === 'easy').length
  const mediumCount = Object.values(ratings).filter((r) => r === 'medium').length
  const hardCount = Object.values(ratings).filter((r) => r === 'hard').length

  // Emit stats to parent whenever they change
  useEffect(() => {
    onStatsChange?.({
      total,
      easy: easyCount,
      medium: mediumCount,
      hard: hardCount,
      current: currentIndex + 1,
    })
  }, [currentIndex, easyCount, mediumCount, hardCount, total])

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

  function handleRate(rating: 'easy' | 'medium' | 'hard') {
    if (!current) return
    setRatings((prev) => ({ ...prev, [current.id]: rating }))
    if (currentIndex < total - 1) handleNext()
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

  if (!current) return null

  return (
    <ContentProtectionWrapper className="max-w-2xl mx-auto px-6 py-8 relative">
      {userName && <WatermarkOverlay userName={userName} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Card {currentIndex + 1} of {total}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="text-green-600">{easyCount} easy</span>
            <span className="text-amber-600">{mediumCount} medium</span>
            <span className="text-red-600">{hardCount} hard</span>
          </div>
        </div>
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Shuffle
        </button>
      </div>

      <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div
        className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl min-h-[260px] p-8 cursor-pointer mb-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        onClick={() => setFlipped(!flipped)}
      >
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

      {flipped && (
        <div className="flex items-center gap-3 justify-center mb-6">
          <button
            onClick={() => handleRate('easy')}
            className="flex-1 py-2.5 text-sm font-medium bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 transition-colors"
          >
            Easy
          </button>
          <button
            onClick={() => handleRate('medium')}
            className="flex-1 py-2.5 text-sm font-medium bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition-colors"
          >
            Medium
          </button>
          <button
            onClick={() => handleRate('hard')}
            className="flex-1 py-2.5 text-sm font-medium bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 transition-colors"
          >
            Hard
          </button>
        </div>
      )}

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
    </ContentProtectionWrapper>
  )
}