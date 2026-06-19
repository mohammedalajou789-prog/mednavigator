'use client'

import { useState, useEffect, useRef } from 'react'
import MNRenderer from './MNRenderer'

interface SheetReaderProps {
  content: string
  title: string
  isSummary?: boolean
}

export default function SheetReader({ content, title, isSummary = false }: SheetReaderProps) {
  const [progress, setProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleScroll() {
      if (!contentRef.current) return
      const el = contentRef.current
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) setProgress(Math.round((scrollTop / scrollHeight) * 100))
    }
    const el = contentRef.current
    el?.addEventListener('scroll', handleScroll)
    return () => el?.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex h-full min-h-0">
      <div ref={contentRef} className="flex-1 overflow-y-auto" style={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between px-6 py-2">
            <span className="text-xs text-gray-400">{isSummary ? 'Summary' : 'Sheet'} · {title}</span>
            <span className="text-xs text-blue-600 font-medium">{progress}% read</span>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <MNRenderer content={content} showWatermark={false} />
        </div>
      </div>
    </div>
  )
}