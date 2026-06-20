'use client'

import { cn } from '@/lib/utils/cn'

interface MNRendererProps {
  content: string
  userName?: string
  showWatermark?: boolean
}

export default function MNRenderer({ content, userName, showWatermark = false }: MNRendererProps) {
  const blocks = parseContent(content)
  return (
    <div className="relative">
      {showWatermark && userName && (
        <div className="pointer-events-none select-none fixed inset-0 z-10 overflow-hidden opacity-[0.035]" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-gray-900 dark:text-white text-sm font-medium whitespace-nowrap"
              style={{ top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
    </div>
  )
}

type BlockType = 'h1' | 'h2' | 'h3' | 'highlight' | 'important' | 'clinical_pearl' | 'must_memorize' | 'previous_year' | 'table' | 'text' | 'empty'

interface Block { type: BlockType; content: string; rows?: string[][] }

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
    if (line === '[HIGHLIGHT]') { const { content, end } = extractBlock(lines, i + 1, '[/HIGHLIGHT]'); blocks.push({ type: 'highlight', content }); i = end + 1; continue }
    if (line === '[IMPORTANT]') { const { content, end } = extractBlock(lines, i + 1, '[/IMPORTANT]'); blocks.push({ type: 'important', content }); i = end + 1; continue }
    if (line === '[CLINICAL_PEARL]') { const { content, end } = extractBlock(lines, i + 1, '[/CLINICAL_PEARL]'); blocks.push({ type: 'clinical_pearl', content }); i = end + 1; continue }
    if (line === '[MUST_MEMORIZE]') { const { content, end } = extractBlock(lines, i + 1, '[/MUST_MEMORIZE]'); blocks.push({ type: 'must_memorize', content }); i = end + 1; continue }
    if (line === '[PREVIOUS_YEAR]') { const { content, end } = extractBlock(lines, i + 1, '[/PREVIOUS_YEAR]'); blocks.push({ type: 'previous_year', content }); i = end + 1; continue }
    if (line === '[TABLE]') { const { rows, end } = extractTable(lines, i + 1); blocks.push({ type: 'table', content: '', rows }); i = end + 1; continue }
    blocks.push({ type: 'text', content: line }); i++
  }
  return blocks
}

function extractBlock(lines: string[], start: number, closeTag: string): { content: string; end: number } {
  const contentLines: string[] = []
  let i = start
  while (i < lines.length && lines[i].trim() !== closeTag) { contentLines.push(lines[i]); i++ }
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

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case 'h1':
      return (
        <h1 key={key} className="text-[1.65rem] font-bold tracking-tight text-gray-950 dark:text-white mt-10 mb-5 first:mt-0 pb-3 border-b-2 border-blue-100 dark:border-blue-900">
          {block.content}
        </h1>
      )
    case 'h2':
      return (
        <h2 key={key} className="text-[1.15rem] font-bold text-blue-700 dark:text-blue-400 mt-8 mb-3 uppercase tracking-wide text-xs">
          {block.content}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={key} className="text-[1rem] font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2">
          {block.content}
        </h3>
      )
    case 'highlight':
      return (
        <div key={key} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-5 py-4 my-4 text-[0.92rem] leading-relaxed text-amber-950 dark:text-amber-200 font-medium">
          {block.content}
        </div>
      )
    case 'important':
      return (
        <div key={key} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 my-4">
          <p className="text-[0.7rem] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest mb-2">⚠ Important</p>
          <p className="text-[0.92rem] leading-relaxed text-red-950 dark:text-red-200">{block.content}</p>
        </div>
      )
    case 'clinical_pearl':
      return (
        <div key={key} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-5 py-4 my-4">
          <p className="text-[0.7rem] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">💎 Clinical Pearl</p>
          <p className="text-[0.92rem] leading-relaxed text-emerald-950 dark:text-emerald-200">{block.content}</p>
        </div>
      )
    case 'must_memorize':
      return (
        <div key={key} className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl px-5 py-4 my-4">
          <p className="text-[0.7rem] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">⭐ Must Memorize</p>
          <p className="text-[0.92rem] leading-relaxed text-violet-950 dark:text-violet-200">{block.content}</p>
        </div>
      )
    case 'previous_year':
      return (
        <div key={key} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-5 py-4 my-4">
          <p className="text-[0.7rem] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">📅 Previous Year</p>
          <p className="text-[0.92rem] leading-relaxed text-orange-950 dark:text-orange-200">{block.content}</p>
        </div>
      )
    case 'table':
      if (!block.rows || block.rows.length === 0) return null
      return (
        <div key={key} className="my-5 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="w-full text-[0.88rem]">
            <thead>
              <tr className="bg-blue-600 dark:bg-blue-800">
                {block.rows[0].map((cell, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, ri) => (
                <tr key={ri} className={cn(
                  'border-t border-gray-100 dark:border-gray-800 transition-colors',
                  ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'
                )}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'empty':
      return <div key={key} className="h-3" />
    default:
      return (
        <p key={key} className="text-[0.95rem] text-gray-700 dark:text-gray-300 leading-[1.85] my-2">
          {block.content}
        </p>
      )
  }
}