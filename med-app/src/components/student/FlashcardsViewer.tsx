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

  const displayCards = showImportantOnly ? cards.filter(c => importantIds.has(c.id)) : cards
  const current = displayCards[currentIndex]
  const total = displayCards.length
  const importantCount = importantIds.size
  const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('bookmarks')
        .select('flashcard_id')
        .eq('user_id', user!.id)
        .eq('bookmark_type', 'flashcard')
        .not('flashcard_id', 'is', null)
      if (data) setImportantIds(new Set(data.map((b: { flashcard_id: string }) => b.flashcard_id)))
      setLoading(false)
    }
    load()
  }, [user])

  useEffect(() => {
    onStatsChange?.({ total, important: importantCount, current: currentIndex + 1, easy: 0, medium: 0, hard: 0 })
  }, [currentIndex, total, importantCount])

  async function toggleImportant(cardId: string) {
    if (!user) return
    if (importantIds.has(cardId)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('flashcard_id', cardId).eq('bookmark_type', 'flashcard')
      setImportantIds(prev => { const n = new Set(prev); n.delete(cardId); return n })
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, flashcard_id: cardId, bookmark_type: 'flashcard' })
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
    setTimeout(() => setCurrentIndex(i => Math.min(i + 1, total - 1)), 150)
  }

  function handlePrev() {
    setFlipped(false)
    setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 150)
  }

  function renderContent(text: string) {
    if (text.includes('[') && text.includes(']')) {
      return <MNRenderer content={text} showWatermark={false} />
    }
    return <p style={{ fontSize: '16px', color: '#1E293B', textAlign: 'center', lineHeight: 1.7, margin: 0 }}>{text}</p>
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (showImportantOnly && displayCards.length === 0) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>No important cards yet</p>
        <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>Mark cards as important while reviewing</p>
        <button onClick={() => { setShowImportantOnly(false); setCurrentIndex(0) }}
          style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Show all cards
        </button>
      </div>
    )
  }

  if (!current) return null
  const isCurrentImportant = importantIds.has(current.id)

  return (
    <div
      style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px 80px', userSelect: 'none', position: 'relative' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Watermark */}
      {userName && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden', pointerEvents: 'none', opacity: 0.04 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', fontSize: '13px', fontWeight: 500, color: '#1E293B', whiteSpace: 'nowrap', top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
            Card {currentIndex + 1} <span style={{ color: '#94A3B8', fontWeight: 400 }}>of {total}</span>
          </p>
          {importantCount > 0 && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#D97706' }}>⭐ {importantCount} important</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {importantCount > 0 && (
            <button
              onClick={() => { setShowImportantOnly(p => !p); setCurrentIndex(0); setFlipped(false) }}
              style={{
                padding: '7px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: showImportantOnly ? '#F59E0B' : '#FFFBEB',
                color: showImportantOnly ? '#fff' : '#D97706',
              }}>
              ⭐ {showImportantOnly ? 'All cards' : 'Important'}
            </button>
          )}
          <button
            onClick={handleShuffle}
            style={{ padding: '7px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#64748B' }}>
            Shuffle
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: '#EEF0F4', borderRadius: '999px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3B82F6, #2563EB)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: '20px',
          border: `2px solid ${isCurrentImportant ? '#FCD34D' : '#E2E8F0'}`,
          minHeight: '280px',
          padding: '32px 28px',
          cursor: 'pointer',
          marginBottom: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: '20px',
            background: flipped ? '#F0FDF4' : '#EFF6FF',
            color: flipped ? '#16A34A' : '#2563EB',
          }}>
            {flipped ? 'Answer' : 'Question'}
          </span>
          {user && (
            <button
              onClick={e => { e.stopPropagation(); toggleImportant(current.id) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px', lineHeight: 1, transition: 'transform 0.15s' }}
              title={isCurrentImportant ? 'Remove from important' : 'Mark as important'}
            >
              {isCurrentImportant ? '⭐' : '☆'}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}>
          {renderContent(flipped ? current.back_text : current.front_text)}
        </div>

        {/* Flip hint */}
        {!flipped && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Tap to reveal answer
            </span>
          </div>
        )}
      </div>

      {/* Important status */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: isCurrentImportant ? '#D97706' : '#CBD5E1', marginBottom: '20px', height: '18px' }}>
        {isCurrentImportant ? '⭐ Marked as important' : user ? 'Tap ☆ to mark as important' : ''}
      </p>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
            borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff',
            fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer',
            opacity: currentIndex === 0 ? 0.4 : 1, transition: 'all 0.15s',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Previous
        </button>

        <button
          onClick={() => setFlipped(!flipped)}
          style={{
            padding: '10px 24px', borderRadius: '12px', border: 'none',
            background: '#EFF6FF', color: '#2563EB',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
          Flip card
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
            borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff',
            fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer',
            opacity: currentIndex === total - 1 ? 0.4 : 1, transition: 'all 0.15s',
          }}>
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}