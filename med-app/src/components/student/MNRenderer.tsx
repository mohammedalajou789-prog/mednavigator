'use client'

import { cn } from '@/lib/utils/cn'
import ImageLightbox from '@/components/student/ImageLightbox'
import ConceptMapBlock from '@/components/student/ConceptMapBlock'

interface MNRendererProps {
  content: string
  userName?: string
  showWatermark?: boolean
  imageSlots?: Record<number, string>
}

export default function MNRenderer({ content, userName, showWatermark = false, imageSlots = {} }: MNRendererProps) {
  const blocks = parseContent(content)
  let h1Counter = 0
  let h2Counter = 0

  const sections = groupBlocksIntoSections(blocks)

  // Occurrence counters shared across the ENTIRE render pass, so that
  // "1st Important box", "2nd Important box", etc. are numbered globally
  // (matching the order they appear in the raw MN Syntax content).
  const occurrenceCounters: Record<string, number> = {}
  function nextOccurrenceId(type: string): string {
    occurrenceCounters[type] = (occurrenceCounters[type] ?? 0) + 1
    return `block-${type}-${occurrenceCounters[type]}`
  }

  return (
    <div className="relative font-sans mn-renderer">
      {showWatermark && userName && (
        <div className="pointer-events-none select-none absolute inset-0 z-10 overflow-hidden opacity-[0.04]" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-gray-900 dark:text-white text-sm font-medium whitespace-nowrap"
              style={{ top: `${(i % 5) * 22 + 5}%`, left: `${Math.floor(i / 5) * 26 - 5}%`, transform: 'rotate(-30deg)' }}>
              {userName}
            </div>
          ))}
        </div>
      )}

      <div>
        {sections.map((section, sIdx) => {
          if (section.type === 'pre') {
            return section.blocks.map((block, bIdx) => {
              if (block.type === 'h1') { h1Counter++; h2Counter = 0 }
              return renderBlock(block, sIdx * 1000 + bIdx, undefined, imageSlots, nextOccurrenceId)
            })
          }

          h2Counter = 0
          const h1Id = `section-${section.heading.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

          const subSections: { heading: Block | null; blocks: Block[] }[] = []
          let currentSub: { heading: Block | null; blocks: Block[] } = { heading: null, blocks: [] }
          for (const block of section.blocks) {
            if (block.type === 'h2') {
              subSections.push(currentSub)
              currentSub = { heading: block, blocks: [] }
            } else {
              currentSub.blocks.push(block)
            }
          }
          subSections.push(currentSub)

          return (
            <div key={`sec-${sIdx}`} style={{ marginBottom: '28px' }}>
              {(() => { h1Counter++; return null })()}
              <div
                id={h1Id}
                data-sync-type="heading"
                style={{
                  scrollMarginTop: '96px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  borderLeft: '4px solid #2563EB',
                  background: '#F8FAFF',
                  borderRadius: '0 10px 10px 0',
                  padding: '12px 18px',
                  marginTop: '24px',
                  marginBottom: '14px',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB', letterSpacing: '0.04em', flexShrink: 0, minWidth: '28px' }}>
                  {String(h1Counter).padStart(2, '0')}
                </span>
                <div style={{ width: '1px', height: '20px', background: '#DBEAFE', flexShrink: 0 }} />
                <h1 className="text-[0.8rem] sm:text-[0.95rem] md:text-[1.05rem]" style={{ margin: 0, fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
  {section.heading.content}
</h1>
              </div>

              {subSections.map((sub, subIdx) => {
                if (!sub.heading && sub.blocks.filter(b => b.type !== 'empty').length === 0) return null

                if (!sub.heading) {
                  return (
                    <div key={`pre-${subIdx}`} style={{ background: '#fff', border: '1px solid #ECEEF3', borderRadius: '18px', padding: '24px 26px', marginBottom: '14px', boxShadow: '0 1px 2px rgba(16,24,40,.03),0 14px 30px -24px rgba(16,24,40,.18)' }}>
                      {sub.blocks.map((block, bIdx) =>
                        renderBlock(block, sIdx * 1000 + subIdx * 100 + bIdx, undefined, imageSlots, nextOccurrenceId)
                      )}
                    </div>
                  )
                }

                h2Counter++
                const currentNum = h2Counter
                const sectionId = `section-${sub.heading.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

                return (
                  <div key={`sub-${subIdx}`} style={{ marginBottom: '14px' }}>
                    <div id={sectionId} data-sync-type="heading" style={{ scrollMarginTop: '96px', background: '#fff', border: '1px solid #ECEEF3', borderRadius: '18px', padding: '24px 26px', boxShadow: '0 1px 2px rgba(16,24,40,.03),0 14px 30px -24px rgba(16,24,40,.18)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(180deg,#3B79FF,#2F6BFF)', color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0, boxShadow: '0 5px 12px -4px rgba(47,107,255,.6)' }}>
                          {currentNum}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '.1em', color: '#2F6BFF' }}>
                          {sub.heading.content.toUpperCase()}
                        </span>
                      </div>
                      {sub.blocks.map((block, bIdx) =>
                        renderBlock(block, sIdx * 1000 + subIdx * 100 + bIdx, undefined, imageSlots, nextOccurrenceId)
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type BlockType =
  | 'h1' | 'h2' | 'h3'
  | 'highlight' | 'important' | 'clinical_pearl'
  | 'must_memorize' | 'previous_year'
  | 'table' | 'text' | 'empty' | 'image_slot'
  | 'card_group_start' | 'card_group_end'
  | 'doctor_notes' | 'source'
  | 'concept_map'

interface FigureLeftItem {
  num: number
  color: string
  title: string
  desc: string
}

interface FigureRightItem {
  color: string
  label: string
  text: string
}

interface Block {
  type: BlockType
  content: string
  rows?: string[][]
  cards?: CardBlock[]
  slotNumber?: number
  slotDescription?: string
  figureTitle?: string
  leftPanel?: FigureLeftItem[]
  rightPanel?: FigureRightItem[]
  rightPanelTitle?: string
  caption?: string
  sourceName?: string
}

interface CardBlock {
  type: 'important' | 'clinical_pearl' | 'must_memorize' | 'previous_year'
  content: string
}

type SectionGroup =
  | { type: 'pre'; blocks: Block[] }
  | { type: 'section'; heading: Block; blocks: Block[] }

function groupBlocksIntoSections(blocks: Block[]): SectionGroup[] {
  const result: SectionGroup[] = []
  let pre: Block[] = []
  let current: { type: 'section'; heading: Block; blocks: Block[] } | null = null

  for (const block of blocks) {
    if (block.type === 'h1') {
      if (pre.length > 0) { result.push({ type: 'pre', blocks: pre }); pre = [] }
      if (current) result.push(current)
      current = { type: 'section', heading: block, blocks: [] }
    } else if (current) {
      current.blocks.push(block)
    } else {
      pre.push(block)
    }
  }
  if (pre.length > 0) result.push({ type: 'pre', blocks: pre })
  if (current) result.push(current)
  return result
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

    const imageSlotMatch  = line.match(/^\[IMAGE_SLOT:(\d+)\]$/)
    const imageSlotInline = line.match(/^\[IMAGE_SLOT:(\d+)\](.+)\[\/IMAGE_SLOT\]$/)

    if (imageSlotInline) {
      blocks.push({ type: 'image_slot', content: '', slotNumber: parseInt(imageSlotInline[1]), slotDescription: imageSlotInline[2].trim() })
      i++; continue
    }

    if (imageSlotMatch) {
      const slotNum = parseInt(imageSlotMatch[1])
      const bodyLines: string[] = []
      let j = i + 1
      while (j < lines.length && lines[j].trim() !== '[/IMAGE_SLOT]') {
        bodyLines.push(lines[j])
        j++
      }
      const hasClosingTag = j < lines.length
      const body = bodyLines.map(l => l.trim()).join('\n')

      if (body.includes('FIGURE_TITLE:') || body.includes('LEFT_PANEL:') || body.includes('RIGHT_PANEL:')) {
        const figureTitle = body.match(/FIGURE_TITLE:\s*(.+)/)?.[1]?.trim()
        const caption     = body.match(/CAPTION:\s*(.+)/)?.[1]?.trim()

        const leftPanel: FigureLeftItem[] = []
        const leftBlock = body.match(/LEFT_PANEL:([\s\S]*?)(?=RIGHT_PANEL:|CAPTION:|$)/)
        if (leftBlock) {
          for (const ll of leftBlock[1].split('\n').map(l => l.trim()).filter(Boolean)) {
            const m = ll.match(/^\[(\d+)\|(\w+)\]\s*(.+?)\s+--\s+(.+)$/)
            if (m) leftPanel.push({ num: +m[1], color: m[2], title: m[3], desc: m[4] })
          }
        }

        const rightPanel: FigureRightItem[] = []
        let rightPanelTitle: string | undefined
        const rightBlock = body.match(/RIGHT_PANEL:([\s\S]*?)(?=CAPTION:|$)/)
        if (rightBlock) {
          for (const rl of rightBlock[1].split('\n').map(l => l.trim()).filter(Boolean)) {
            const t = rl.match(/^PANEL_TITLE:\s*(.+)$/)
            if (t) { rightPanelTitle = t[1].trim(); continue }
            const m = rl.match(/^\[(\w+)\]\s*(.+?)\s*=\s*(.+)$/)
            if (m) rightPanel.push({ color: m[1], label: m[2].trim() + ' =', text: m[3].trim() })
          }
        }

        blocks.push({
          type: 'image_slot', content: '', slotNumber: slotNum, figureTitle, caption,
          leftPanel:      leftPanel.length  ? leftPanel      : undefined,
          rightPanel:     rightPanel.length ? rightPanel     : undefined,
          rightPanelTitle,
        })
        i = hasClosingTag ? j + 1 : j; continue
      }

      // simple: optional single-line description
      const desc = bodyLines.find(l => l.trim())?.trim()
      blocks.push({ type: 'image_slot', content: '', slotNumber: slotNum, slotDescription: desc })
      i = hasClosingTag ? j + 1 : j; continue
    }

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
    if (line === '[CONCEPT_MAP]') {
      const { content, end } = extractBlock(lines, i + 1, '[/CONCEPT_MAP]')
      blocks.push({ type: 'concept_map', content })
      i = end + 1; continue
    }
    if (line === '[doctor notes]') {
      const { content: blockContent, end } = extractBlock(lines, i + 1, '[/doctor notes]')
      blocks.push({ type: 'doctor_notes', content: blockContent })
      i = end + 1; continue
    }

    const sourceMatch = line.match(/^\[\*(.+?)\*\]$/)
    if (sourceMatch) {
      const sourceName = sourceMatch[1]
      const closeTag = `[/*${sourceName}*]`
      // collect content between tags
      const sourceLines: string[] = []
      let j = i + 1
      while (j < lines.length && lines[j].trim().replace(/\r/g, '') !== closeTag) { sourceLines.push(lines[j]); j++ }
      blocks.push({ type: 'source', content: sourceLines.join('\n').replace(/^\n+|\n+$/g, ''), sourceName })
      i = j + 1; continue
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
  // FIX 4: preserve newlines — join with \n, trim only leading/trailing blank lines
  return { content: contentLines.join('\n').replace(/^\n+|\n+$/g, ''), end: i }
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

function renderBold(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*.+?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={keyPrefix + i}>{part.slice(2, -2)}</strong>
    }
    return <span key={keyPrefix + i}>{part}</span>
  })
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(==.+?==)/g)
  return parts.map((part, i) => {
    if (part.startsWith('==') && part.endsWith('==')) {
      const inner = part.slice(2, -2)
      return (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded not-italic text-gray-900">
          {renderBold(inner, 'h' + i)}
        </mark>
      )
    }
    return <span key={i}>{renderBold(part, 'p' + i)}</span>
  })
}

// FIX 4: render multi-line content — split by \n and render each line
// Empty lines become a small spacer, non-empty lines render inline
function renderMultiLine(content: string): React.ReactNode {
  const segments: React.ReactNode[] = []
  const lines = content.split('\n')
  let i = 0
  let segKey = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (line.startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length) {
        const tLine = lines[i].trim()
        if (!tLine.startsWith('|')) break
        if (!tLine.match(/^\|[-| ]+\|$/)) {
          tableRows.push(tLine.split('|').slice(1, -1).map(c => c.trim()))
        }
        i++
      }
      if (tableRows.length > 0) {
        segments.push(
          <div key={segKey++} className="my-3 overflow-x-auto rounded-xl shadow-sm">
            <table className="w-full text-[0.85rem]">
              <thead>
                <tr className="bg-blue-50">
                  {tableRows[0].map((cell, ci) => (
                    <th key={ci} className="px-4 py-2 text-left text-[0.72rem] font-extrabold text-blue-600 uppercase tracking-wider border-b border-blue-100">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={`px-4 py-2 text-[0.85rem] text-gray-700 leading-relaxed border-t border-gray-100 ${ci === 0 ? 'font-semibold text-gray-900' : ''}`}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    if (!line) {
      segments.push(<br key={segKey++} />)
    } else {
      segments.push(
        <span key={segKey++} style={{ display: 'block' }}>
          {renderInline(lines[i])}
        </span>
      )
    }
    i++
  }

  return <>{segments}</>
}

function renderBlock(
  block: Block,
  key: number,
  _h2Number?: number,
  imageSlots: Record<number, string> = {},
  nextOccurrenceId?: (type: string) => string
) {
  switch (block.type) {

    case 'image_slot': {
      const slotNum  = block.slotNumber ?? 0
      const imageUrl = imageSlots[slotNum]
      const FC: Record<string, string> = {
        blue: '#2f6fd1', green: '#3f9142', orange: '#b8792a',
        purple: '#5b4b8a', red: '#c0392b', amber: '#8a6d3b',
        teal: '#1D9E75', pink: '#D4537E', gray: '#888780',
      }
      const hasExt = !!(block.leftPanel?.length || block.rightPanel?.length || block.figureTitle)

      // ── simple backward-compatible render ─────────────────────────────────
      if (!hasExt) {
        return (
          <div key={key} style={{ marginBottom: '20px', border: '1px solid #dde5f0', borderRadius: '16px', overflow: 'hidden', boxShadow: 'rgba(20,30,50,0.06) 0 1px 3px' }}>
            {block.slotDescription && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'linear-gradient(#f7fafe,#f1f5fc)', borderBottom: '1px solid #dde5f0' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2f6fd1" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c2b45' }}>{block.slotDescription}</span>
              </div>
            )}
            <div style={{ background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '120px' }}>
              {imageUrl ? (
                <div style={{ maxWidth: '600px', width: '100%' }}>
                  <ImageLightbox src={imageUrl} alt={block.slotDescription ?? 'Image ' + slotNum} className="max-w-full h-auto rounded-xl block" />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px' }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>{'[IMAGE_SLOT:' + slotNum + ']'}</span>
                  {block.slotDescription && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{block.slotDescription}</span>}
                </div>
              )}
            </div>
          </div>
        )
      }

      // ── extended: 3-panel figure layout ───────────────────────────────────
      return (
        <div key={key} style={{ width: '100%', background: 'linear-gradient(#f7fafe,#f1f5fc)', border: '1px solid #dde5f0', borderRadius: '16px', overflow: 'hidden', boxShadow: 'rgba(20,30,50,0.06) 0 1px 3px', marginBottom: '24px' }}>

          {block.figureTitle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #dde5f0' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2f6fd1" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span style={{ margin: 0, fontSize: '15px', color: '#1c2b45', fontWeight: 700 }}>{block.figureTitle}</span>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <div className="figure-grid">

              {block.leftPanel && block.leftPanel.length > 0 && (
                <div className="figure-grid-left">
                  {block.leftPanel.map((item, idx) => {
                    const c = FC[item.color] ?? '#2f6fd1'
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: c, color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.num}
                        </span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: c }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#4b5568', lineHeight: 1.35, marginTop: '2px' }}>{item.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="figure-grid-image">
                {imageUrl ? (
                  <div style={{ maxWidth: '520px', width: '100%' }}>
                    <ImageLightbox
                      src={imageUrl}
                      alt={block.figureTitle ?? block.slotDescription ?? 'Image ' + slotNum}
                      className="w-full h-auto rounded-xl block"
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', minHeight: '220px', background: 'rgba(255,255,255,0.6)', border: '1.5px dashed #b9cbe6', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>{'[IMAGE_SLOT:' + slotNum + ']'}</span>
                  </div>
                )}
              </div>

              {block.rightPanel && block.rightPanel.length > 0 && (
                <div className="figure-grid-right">
                  {block.rightPanelTitle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2f6fd1" strokeWidth={2}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c2b45' }}>{block.rightPanelTitle}</span>
                    </div>
                  )}
                  {block.rightPanel.map((item, idx) => {
                    const c = FC[item.color] ?? '#2f6fd1'
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ flexShrink: 0, width: '8px', height: '8px', borderRadius: '50%', background: c, marginTop: '5px', display: 'inline-block' }} />
                        <span style={{ fontSize: '12px', color: '#2c3547', lineHeight: 1.35 }}>
                          <strong style={{ color: c }}>{item.label + ' '}</strong>{item.text}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          </div>

          {imageUrl && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '4px 20px 16px' }}>
              <a href={imageUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #d7dde8', background: '#fff', color: '#2c3547', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Zoom
              </a>
              <a href={imageUrl} download
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #d7dde8', background: '#fff', color: '#2c3547', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </a>
            </div>
          )}

          {block.caption && (
            <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7688', fontStyle: 'italic', lineHeight: 1.4 }}>{block.caption}</p>
            </div>
          )}

        </div>
      )
    }

    case 'h1': {
      const h1Id = `section-${block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      return (
        <h1 key={key} id={h1Id} data-sync-type="heading" style={{ scrollMarginTop: '96px', fontSize: '1.9rem', fontWeight: 900, color: '#15203A', marginTop: '32px', marginBottom: '20px', letterSpacing: '-0.022em', lineHeight: 1.2 }}>
          {block.content}
        </h1>
      )
    }

    case 'h2': {
      const sectionId = `section-${block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      return (
        <div key={key} id={sectionId} data-sync-type="heading" style={{ scrollMarginTop: '96px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(180deg,#3B79FF,#2F6BFF)', color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>?</span>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '.1em', color: '#2F6BFF' }}>{block.content.toUpperCase()}</span>
        </div>
      )
    }

    case 'h3':
      return (
        <h3 key={key} id={`section-${block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} data-sync-type="heading" style={{ scrollMarginTop: '96px' }} className="text-[1.05rem] font-bold text-slate-800 dark:text-slate-200 mt-8 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
          {block.content}
        </h3>
      )

    case 'highlight': {
      const id = nextOccurrenceId?.('highlight')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#FFFAED,#FFFDF8)', border: '1px solid #F4E6BC', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#FCEFC4', color: '#D89A06', flexShrink: 0, marginTop: '2px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>
          </span>
          {/* FIX 4: renderMultiLine instead of renderInline */}
          <div style={{ margin: 0, fontSize: '16px', lineHeight: 1.7, color: '#534820' }}>{renderMultiLine(block.content)}</div>
        </div>
      )
    }

    case 'important': {
      const id = nextOccurrenceId?.('important')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', position: 'relative', overflow: 'hidden', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#FFF4F3,#FFFAFA)', border: '1px solid #FAD7D3', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#FBDAD6', color: '#DC4842', flexShrink: 0, marginTop: '2px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#DC4842', marginBottom: '5px' }}>IMPORTANT</div>
            {/* FIX 4: renderMultiLine instead of renderInline */}
            <div style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#5A4341' }}>{renderMultiLine(block.content)}</div>
          </div>
        </div>
      )
    }

    case 'clinical_pearl': {
      const id = nextOccurrenceId?.('clinical_pearl')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#EEF4FF,#F7FAFF)', border: '1px solid #DCE6FB', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#DCE7FF', color: '#2F6BFF', flexShrink: 0, marginTop: '2px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#2F6BFF', marginBottom: '5px' }}>CLINICAL PEARL</div>
            {/* FIX 4: renderMultiLine instead of renderInline */}
            <div style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#39496B' }}>{renderMultiLine(block.content)}</div>
          </div>
        </div>
      )
    }

    case 'must_memorize': {
      const id = nextOccurrenceId?.('must_memorize')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#EDFBF4,#F5FDF8)', border: '1px solid #B8EDD3', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#C8F0DC', color: '#138A5A', flexShrink: 0, marginTop: '2px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#138A5A', marginBottom: '5px' }}>MUST MEMORIZE</div>
            {/* FIX 4: renderMultiLine instead of renderInline */}
            <div style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, fontWeight: 700, color: '#1A5C3A' }}>{renderMultiLine(block.content)}</div>
          </div>
        </div>
      )
    }

    case 'previous_year': {
      const id = nextOccurrenceId?.('previous_year')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#F6F0FF,#FAF7FF)', border: '1px solid #DDD0FA', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#EDE0FC', color: '#7C3AED', flexShrink: 0, marginTop: '2px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#7C3AED', marginBottom: '5px' }}>PREVIOUS YEAR</div>
            {/* FIX 4: renderMultiLine instead of renderInline */}
            <div style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#3D2A6B' }}>{renderMultiLine(block.content)}</div>
          </div>
        </div>
      )
    }

    case 'table': {
      if (!block.rows || block.rows.length === 0) return null
      const id = nextOccurrenceId?.('table')
      return (
        <div key={key} id={id} data-sync-type="table" className="my-6 overflow-x-auto rounded-xl shadow-sm" style={{ scrollMarginTop: '96px' }}>
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
    }


    case 'doctor_notes': {
      const id = nextOccurrenceId?.('doctor_notes')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#FFFBF0,#FFFDF8)', border: '1px solid #F0D9A0', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#FEF3C7', color: '#92400E', flexShrink: 0, marginTop: '2px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#92400E', marginBottom: '5px' }}>DOCTOR NOTES</div>
            <div style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#78350F', fontStyle: 'italic' }}>{renderMultiLine(block.content)}</div>
          </div>
        </div>
      )
    }

    case 'source': {
      const id = nextOccurrenceId?.('source')
      return (
        <div key={key} id={id} data-sync-type="box" style={{ scrollMarginTop: '96px', borderRadius: '14px', background: 'linear-gradient(180deg,#F8FAFF,#F1F5FF)', border: '1px solid #DBEAFE', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{block.sourceName}</span>
          </div>
          <div style={{ padding: '14px 16px', fontSize: '15px', lineHeight: 1.7, color: '#1E3A6E' }}>{renderMultiLine(block.content)}</div>
        </div>
      )
    }

    case 'concept_map':
      return (
        <div key={key} style={{ scrollMarginTop: '96px', marginBottom: '16px' }} data-sync-type="box">
          <ConceptMapBlock content={block.content} />
        </div>
      )

    case 'empty':
      return <div key={key} className="h-1" />

    default:
      return (
        <p key={key} data-sync-type="text" style={{ fontSize: '15.5px', lineHeight: 1.75, color: '#3C4661', margin: '0 0 14px' }}>
          {renderInline(block.content)}
        </p>
      )
  }
}