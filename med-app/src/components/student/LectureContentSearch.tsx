'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

interface SearchResult {
  id: string
  text: string
  context: string
  elementId: string
}

interface Props {
  sheetContent: string
  summaryContent: string
  activeTab: string
}

export default function LectureContentSearch({ sheetContent, summaryContent, activeTab }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const content = activeTab === 'sheet' ? sheetContent : summaryContent

  // Build searchable index from content
  const searchIndex = useMemo(() => {
    if (!content) return []
    const lines = content.split('\n')
    const results: SearchResult[] = []
    let h1Counter = 0
    let h2Counter = 0
    let currentH1 = ''
    let currentH2 = ''

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return

      // Track headings
      if (trimmed.startsWith('# ')) {
        h1Counter++
        h2Counter = 0
        currentH1 = trimmed.slice(2).trim()
        currentH2 = ''
        const id = `section-${currentH1.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
        results.push({
          id: `h1-${idx}`,
          text: currentH1,
          context: 'Section',
          elementId: id,
        })
        return
      }
      if (trimmed.startsWith('## ')) {
        h2Counter++
        currentH2 = trimmed.slice(3).trim()
        const id = `section-${currentH2.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
        results.push({
          id: `h2-${idx}`,
          text: currentH2,
          context: currentH1 || 'Sub-section',
          elementId: id,
        })
        return
      }
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4).trim()
        const id = `section-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
        results.push({
          id: `h3-${idx}`,
          text,
          context: currentH2 || currentH1 || 'Sub-section',
          elementId: id,
        })
        return
      }

      // Skip MN syntax tags
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) return

      // Index regular text lines (min 20 chars)
      const cleanText = trimmed
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/==(.*?)==/g, '$1')
      if (cleanText.length >= 20) {
        results.push({
          id: `text-${idx}`,
          text: cleanText.length > 80 ? cleanText.slice(0, 80) + '...' : cleanText,
          context: currentH2 || currentH1 || '',
          elementId: currentH2
            ? `section-${currentH2.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
            : currentH1
            ? `section-${currentH1.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
            : '',
        })
      }
    })

    return results
  }, [content])

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    return searchIndex
      .filter(r => r.text.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, searchIndex])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(result: SearchResult) {
    setQuery('')
    setOpen(false)

    const el = document.getElementById(result.elementId)
    const scrollContainer = document.getElementById('lecture-content-scroll')

    if (el && scrollContainer) {
      const elTop = el.getBoundingClientRect().top
      const containerTop = scrollContainer.getBoundingClientRect().top
      const offset = elTop - containerTop + scrollContainer.scrollTop - 120
      scrollContainer.scrollTo({ top: offset, behavior: 'smooth' })

      // Highlight briefly
      el.style.transition = 'background 0.3s'
      const prev = el.style.background
      el.style.background = '#DBEAFE'
      setTimeout(() => { el.style.background = prev }, 1500)
    }
  }

  if (activeTab !== 'sheet' && activeTab !== 'summary') return null
  if (!content) return null

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', background: '#fff', borderRadius: '16px', border: '1px solid #EAEDF2', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Search in Lecture
      </p>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <svg
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', flexShrink: 0 }}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          placeholder="Search this lecture..."
          style={{
            width: '100%', height: '36px', borderRadius: '10px',
            border: '1px solid #E2E8F0', background: '#F8FAFC',
            padding: '0 10px 0 32px', fontSize: '13px', color: '#0F172A',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '16px', lineHeight: 1, padding: '2px' }}
          >×</button>
        )}
      </div>

      {/* Results dropdown */}
      {open && filteredResults.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
          maxHeight: '280px', overflowY: 'auto',
        }}>
          {filteredResults.map(result => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              style={{
                width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: '2px', padding: '10px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F1F5F9',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FF')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', lineHeight: 1.4 }}>
                {result.text}
              </span>
              {result.context && (
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>
                  {result.context}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.length >= 2 && filteredResults.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '14px',
          textAlign: 'center', fontSize: '13px', color: '#94A3B8',
        }}>
          No results found
        </div>
      )}
    </div>
  )
}