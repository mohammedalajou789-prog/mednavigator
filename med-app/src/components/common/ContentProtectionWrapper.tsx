'use client'

import { useEffect, useRef } from 'react'

interface ContentProtectionWrapperProps {
  children: React.ReactNode
  className?: string
}

export default function ContentProtectionWrapper({
  children,
  className,
}: ContentProtectionWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c'
      const isSelectAll = (e.ctrlKey || e.metaKey) && e.key === 'a'
      const isPrint = (e.ctrlKey || e.metaKey) && e.key === 'p'
      if (isCopy || isSelectAll || isPrint) {
        e.preventDefault()
      }
    }

    el.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      el.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {children}
    </div>
  )
}