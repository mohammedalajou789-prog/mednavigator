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
      <div className="prose prose-gray dark:prose-invert max-w-none">
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
    case 'h1': return <h1 key={key} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 first:mt-0">{block.content}</h1>
    case 'h2': return <h2 key={key} className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-6 mb-3">{block.content}</h2>
    case 'h3': return <h3 key={key} className="text-base font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-2">{block.content}</h3>
    case 'highlight': return <div key={key} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3 my-3 text-sm text-yellow-900 dark:text-yellow-200">{block.content}</div>
    case 'important': return (
      <div key={key} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg px-4 py-3 my-3">
        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">⚠ Important</p>
        <p className="text-sm text-red-900 dark:text-red-200">{block.content}</p>
      </div>
    )
    case 'clinical_pearl': return (
      <div key={key} className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg px-4 py-3 my-3">
        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">💎 Clinical Pearl</p>
        <p className="text-sm text-green-900 dark:text-green-200">{block.content}</p>
      </div>
    )
    case 'must_memorize': return (
      <div key={key} className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded-r-lg px-4 py-3 my-3">
        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">⭐ Must Memorize</p>
        <p className="text-sm text-purple-900 dark:text-purple-200">{block.content}</p>
      </div>
    )
    case 'previous_year': return (
      <div key={key} className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg px-4 py-3 my-3">
        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">📅 Previous Year Concept</p>
        <p className="text-sm text-orange-900 dark:text-orange-200">{block.content}</p>
      </div>
    )
    case 'table':
      if (!block.rows || block.rows.length === 0) return null
      return (
        <div key={key} className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800">{block.rows[0].map((cell, i) => <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">{cell}</th>)}</tr></thead>
            <tbody>{block.rows.slice(1).map((row, ri) => <tr key={ri} className={cn('border-t border-gray-100 dark:border-gray-800', ri % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/30')}>{row.map((cell, ci) => <td key={ci} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    case 'empty': return <div key={key} className="h-2" />
    default: return <p key={key} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-1.5">{block.content}</p>
  }
}