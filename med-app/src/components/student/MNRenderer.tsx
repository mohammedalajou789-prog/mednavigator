'use client'

import { cn } from '@/lib/utils/cn'

interface MNRendererProps {
  content: string
  userName?: string
  showWatermark?: boolean
}

export default function MNRenderer({ content, userName, showWatermark = false }: MNRendererProps) {
  const blocks = parseContent(content)
  let h2Counter = 0

  return (
    <div className="relative font-sans">
      {showWatermark && userName && (
        <div className="pointer-events-none select-none fixed inset-0 z-10 overflow-hidden opacity-[0.04]" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-gray-900 dark:text-white text-sm font-medium whitespace-nowrap"
              style={{ top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}
      <div className="max-w-3xl mx-auto space-y-0">
        {blocks.map((block, index) => {
          if (block.type === 'h2') h2Counter++
          return renderBlock(block, index, block.type === 'h2' ? h2Counter : undefined)
        })}
      </div>
    </div>
  )
}

type BlockType =
  | 'h1' | 'h2' | 'h3'
  | 'highlight' | 'important' | 'clinical_pearl'
  | 'must_memorize' | 'previous_year'
  | 'table' | 'text' | 'empty'
  | 'card_group_start' | 'card_group_end'

interface Block {
  type: BlockType
  content: string
  rows?: string[][]
  cards?: CardBlock[]
}

interface CardBlock {
  type: 'important' | 'clinical_pearl' | 'must_memorize' | 'previous_year'
  content: string
}

function parseContent(raw: string): Block[] {
  if (!raw) return []
  const lines = raw.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) { blocks.push({ type: 'empty', content: '' }); i++; continue }
    if (line.startsWith('# ')) { blocks.push({ type: 'h1', content: line.slice(2) }); i++; continue }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', content: line.slice(3) }); i++; continue }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', content: line.slice(4) }); i++; continue }

    if (line === '[HIGHLIGHT]') {
      const { content, end } = extractBlock(lines, i + 1, '[/HIGHLIGHT]')
      blocks.push({ type: 'highlight', content })
      i = end + 1; continue
    }
    if (line === '[IMPORTANT]') {
      const { content, end } = extractBlock(lines, i + 1, '[/IMPORTANT]')
      blocks.push({ type: 'important', content })
      i = end + 1; continue
    }
    if (line === '[CLINICAL_PEARL]') {
      const { content, end } = extractBlock(lines, i + 1, '[/CLINICAL_PEARL]')
      blocks.push({ type: 'clinical_pearl', content })
      i = end + 1; continue
    }
    if (line === '[MUST_MEMORIZE]') {
      const { content, end } = extractBlock(lines, i + 1, '[/MUST_MEMORIZE]')
      blocks.push({ type: 'must_memorize', content })
      i = end + 1; continue
    }
    if (line === '[PREVIOUS_YEAR]') {
      const { content, end } = extractBlock(lines, i + 1, '[/PREVIOUS_YEAR]')
      blocks.push({ type: 'previous_year', content })
      i = end + 1; continue
    }
    if (line === '[TABLE]') {
      const { rows, end } = extractTable(lines, i + 1)
      blocks.push({ type: 'table', content: '', rows })
      i = end + 1; continue
    }

    blocks.push({ type: 'text', content: line })
    i++
  }

  return blocks
}

function extractBlock(lines: string[], start: number, closeTag: string): { content: string; end: number } {
  const contentLines: string[] = []
  let i = start
  while (i < lines.length && lines[i].trim() !== closeTag) {
    contentLines.push(lines[i])
    i++
  }
  return { content: contentLines.join('\n').trim(), end: i }
}

function extractTable(lines: string[], start: number): { rows: string[][]; end: number } {
  const rows: string[][] = []
  let i = start
  while (i < lines.length && lines[i].trim() !== '[/TABLE]') {
    const line = lines[i].trim()
    if (line.startsWith('|') && !line.match(/^\|[-| ]+\|$/)) {
      rows.push(line.split('|').slice(1, -1).map((c) => c.trim()))
    }
    i++
  }
  return { rows, end: i }
}

// Render inline text with **bold** and ==highlight== support
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(==.+?==|\*\*.+?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('==') && part.endsWith('==')) {
      return <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-gray-900 dark:text-yellow-100 px-0.5 rounded not-italic">{part.slice(2, -2)}</mark>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function renderBlock(block: Block, key: number, h2Number?: number) {
  switch (block.type) {

    case 'h1':
      return (
        <h1 key={key} className="text-[2rem] font-extrabold text-gray-950 dark:text-white mt-10 mb-2 first:mt-0 tracking-tight leading-tight">
          {block.content}
        </h1>
      )

    case 'h2':
      return (
        <div key={key} className="mt-10 mb-4 first:mt-0">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {h2Number}
            </span>
            <h2 className="text-[1.1rem] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              {block.content}
            </h2>
          </div>
          <div className="mt-2 h-[2px] bg-gradient-to-r from-blue-100 to-transparent dark:from-blue-900" />
        </div>
      )

    case 'h3':
      return (
        <h3 key={key} className="text-[1rem] font-bold text-gray-800 dark:text-gray-200 mt-6 mb-2 flex items-center gap-2">
          <span className="text-blue-400">•</span>
          {block.content}
        </h3>
      )

    case 'highlight':
      return (
        <div key={key} className="my-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-5 py-4">
          <span className="text-amber-400 text-lg mt-0.5">☆</span>
          <p className="text-[0.95rem] leading-relaxed text-amber-900 dark:text-amber-200 font-medium">
            {renderInline(block.content)}
          </p>
        </div>
      )

    case 'important':
      return (
        <div key={key} className="my-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500 text-base">⚠️</span>
            <span className="text-[0.7rem] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest">Important</span>
          </div>
          <p className="text-[0.93rem] leading-relaxed text-gray-800 dark:text-gray-200">
            {renderInline(block.content)}
          </p>
        </div>
      )

    case 'clinical_pearl':
      return (
        <div key={key} className="my-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-500 text-base">💡</span>
            <span className="text-[0.7rem] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Clinical Pearl</span>
          </div>
          <p className="text-[0.93rem] leading-relaxed text-gray-800 dark:text-gray-200">
            {renderInline(block.content)}
          </p>
        </div>
      )

    case 'must_memorize':
      return (
        <div key={key} className="my-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-500 text-base">🧠</span>
            <span className="text-[0.7rem] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Must Memorize</span>
          </div>
          <p className="text-[0.93rem] leading-relaxed font-bold text-emerald-700 dark:text-emerald-300">
            {renderInline(block.content)}
          </p>
        </div>
      )

    case 'previous_year':
      return (
        <div key={key} className="my-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-500 text-base">🎯</span>
            <span className="text-[0.7rem] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Previous Year</span>
          </div>
          <p className="text-[0.93rem] leading-relaxed text-gray-800 dark:text-gray-200">
            {renderInline(block.content)}
          </p>
        </div>
      )

    case 'table':
      if (!block.rows || block.rows.length === 0) return null
      return (
        <div key={key} className="my-6 overflow-x-auto rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm">
          <table className="w-full text-[0.9rem]">
            <thead>
              <tr className="bg-blue-50 dark:bg-blue-900/40">
                {block.rows[0].map((cell, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[0.75rem] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-blue-100 dark:border-blue-800">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, ri) => (
                <tr key={ri} className={cn(
                  'border-t border-gray-100 dark:border-gray-800',
                  ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/80 dark:bg-gray-800/40'
                )}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={cn(
                      'px-5 py-3 text-[0.9rem] text-gray-700 dark:text-gray-300 leading-relaxed',
                      ci === 0 && 'font-semibold text-gray-900 dark:text-white'
                    )}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'empty':
      return <div key={key} className="h-2" />

    default:
      return (
        <p key={key} className="text-[0.97rem] text-gray-700 dark:text-gray-300 leading-[1.9] my-2.5">
          {renderInline(block.content)}
        </p>
      )
  }
}