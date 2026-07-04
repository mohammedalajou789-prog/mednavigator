'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  const [loading, setLoading] = useState(true)
  const [knownCount, setKnownCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  const total = cards.length
  const current = cards[currentIndex]
  const importantCount = importantIds.size
  const progressPct = total > 0 ? Math.round((currentIndex / total) * 100) : 0

  const { data: bookmarkData, isLoading: bookmarkLoading } = useQuery({
    queryKey: ['bookmarks', 'flashcard', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('flashcard_id')
        .eq('user_id', user!.id)
        .eq('bookmark_type', 'flashcard')
        .not('flashcard_id', 'is', null)
      return data ?? []
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (bookmarkLoading) return
    if (bookmarkData) {
      setImportantIds(new Set(bookmarkData.map((b: { flashcard_id: string }) => b.flashcard_id)))
    }
    setLoading(false)
  }, [bookmarkData, bookmarkLoading])

  useEffect(() => {
    onStatsChange?.({ total, important: importantCount, current: currentIndex + 1, easy: knownCount, medium: 0, hard: reviewCount })
  }, [currentIndex, total, importantCount, knownCount, reviewCount])

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
    setKnownCount(0)
    setReviewCount(0)
  }

  function handleNext() {
    setFlipped(false)
    setTimeout(() => setCurrentIndex(i => Math.min(i + 1, total - 1)), 150)
  }

  function handlePrev() {
    setFlipped(false)
    setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 150)
  }

  function handleGotIt() {
    setKnownCount(k => k + 1)
    handleNext()
  }

  function handleNeedsReview() {
    setReviewCount(r => r + 1)
    handleNext()
  }

  function renderContent(text: string, side: 'front' | 'back' = 'back') {
    if (text.includes('[') && text.includes(']')) {
      return <MNRenderer content={text} showWatermark={false} />
    }
    if (side === 'front') {
      return (
        <p style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', textAlign: 'center', lineHeight: 1.4, margin: 0, letterSpacing: '-0.01em' }}>
          {text}
        </p>
      )
    }
    return (
      <p style={{ fontSize: '17px', fontWeight: 500, color: '#22304F', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
        {text}
      </p>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!current) return null
  const isCurrentImportant = importantIds.has(current.id)

  return (
    <div
      style={{ maxWidth: '100%', margin: '0 auto', padding: '8px 0 60px', userSelect: 'none', position: 'relative' }}
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

      {/* Top stats + actions row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginBottom: '14px' }}>
        {/* Known count */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#138A5A' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {knownCount}
        </span>
        {/* Review count */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#D89A06' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
          </svg>
          {reviewCount}
        </span>
        {/* Shuffle */}
        <button
          onClick={handleShuffle}
          title="Shuffle"
          style={{ width: '32px', height: '32px', borderRadius: '9px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>
        {/* Important bookmark */}
        {user && (
          <button
            onClick={() => toggleImportant(current.id)}
            title={isCurrentImportant ? 'Remove from important' : 'Mark as important'}
            style={{ width: '32px', height: '32px', borderRadius: '9px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCurrentImportant ? '#D97706' : '#94A3B8' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isCurrentImportant ? '#FDE68A' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Card counter + progress bar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#33415A', whiteSpace: 'nowrap' }}>
          Card {currentIndex + 1} of {total}
        </span>
        <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: '#E7EAF1', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: '#2563EB', transition: 'width 0.35s', width: `${progressPct}%` }} />
        </div>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>
          {progressPct}% completed
        </span>
      </div>

      {/* Dot navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '7px', marginBottom: '20px' }}>
        {cards.map((_, i) => (
          <span
            key={i}
            onClick={() => { setCurrentIndex(i); setFlipped(false) }}
            style={{
              width: i === currentIndex ? '22px' : '7px',
              height: '7px',
              borderRadius: '99px',
              background: i === currentIndex ? '#2563EB' : '#D6DCE7',
              transition: 'width 0.3s ease, background 0.3s ease',
              cursor: 'pointer',
              display: 'inline-block',
            }}
          />
        ))}
      </div>

      {/* Card stack wrapper */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        {/* Stack shadow cards */}
        <div style={{ position: 'absolute', left: '24px', right: '24px', top: '14px', height: '100%', background: '#fff', border: '1px solid #ECEEF3', borderRadius: '24px', opacity: 0.45 }} />
        <div style={{ position: 'absolute', left: '12px', right: '12px', top: '7px', height: '100%', background: '#fff', border: '1px solid #ECEEF3', borderRadius: '24px', opacity: 0.7 }} />

        {/* Main card with 3D flip */}
        <div style={{ position: 'relative', perspective: '2000px', width: '100%', height: 'clamp(270px, 42vw, 360px)' }}>
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.55s cubic-bezier(0.34, 1.1, 0.64, 1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              cursor: 'pointer',
            }}
          >
            {/* FRONT FACE */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(#ffffff 0%, #FCFDFF 100%)',
              border: '1px solid #ECEEF3',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(16,24,40,0.04), 0 10px 20px -10px rgba(16,24,40,0.12), 0 28px 50px -28px rgba(37,99,235,0.20)',
              display: 'flex',
              flexDirection: 'column',
              padding: '30px 32px',
              textAlign: 'center',
            }}>
              {/* Front header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#2563EB', textTransform: 'uppercase', background: '#EEF3FF', padding: '5px 12px', borderRadius: '99px' }}>
                  Term
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>
                  Card {currentIndex + 1} / {total}
                </span>
              </div>
              {/* Divider */}
              <div style={{ height: '1px', background: '#F1F3F7', margin: '16px 0 0', flexShrink: 0 }} />
              {/* Term content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: 0 }}>
                <div style={{ width: '100%' }}>
                  {renderContent(current.front_text, 'front')}
                </div>
              </div>
              {/* Tap to reveal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0, opacity: 0.75 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Tap to reveal</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(#F3F7FF 0%, #EAF1FF 100%)',
              border: `1px solid ${isCurrentImportant ? '#FCD34D' : '#DBE9FE'}`,
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(16,24,40,0.04), 0 10px 20px -10px rgba(16,24,40,0.12), 0 28px 50px -28px rgba(37,107,255,0.25)',
              display: 'flex',
              flexDirection: 'column',
              padding: '30px 32px',
              textAlign: 'center',
            }}>
              {/* Back header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#2563EB', textTransform: 'uppercase' }}>
                  Definition
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6C86C4' }}>
                  Card {currentIndex + 1} / {total}
                </span>
              </div>
              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(37,99,235,0.12)', margin: '16px 0 0', flexShrink: 0 }} />
              {/* Answer content */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                {renderContent(current.back_text)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!flipped ? (
        /* Before reveal: Previous / Show Answer / Next */
        <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              flex: 1,
              height: '52px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              background: '#fff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 700,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: currentIndex === 0 ? 0.45 : 1,
              transition: 'transform 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Previous
          </button>
          <button
            onClick={() => setFlipped(true)}
            style={{
              flex: 2,
              height: '52px',
              borderRadius: '14px',
              border: 'none',
              background: '#2563EB',
              color: '#fff',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
          >
            Show Answer
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === total - 1}
            style={{
              flex: 1,
              height: '52px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              background: '#fff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 700,
              cursor: currentIndex === total - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: currentIndex === total - 1 ? 0.45 : 1,
              transition: 'transform 0.15s',
            }}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      ) : (
        /* After reveal: Needs review / Got it */
        <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
          <button
            onClick={handleNeedsReview}
            style={{
              flex: 1,
              height: '52px',
              borderRadius: '14px',
              border: '1px solid #FCD34D',
              background: '#FFFBEB',
              color: '#D97706',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
            </svg>
            Needs review
          </button>
          <button
            onClick={handleGotIt}
            style={{
              flex: 2,
              height: '52px',
              borderRadius: '14px',
              border: 'none',
              background: '#16A34A',
              color: '#fff',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.15s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
