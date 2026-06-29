'use client'

import { cn } from '@/lib/utils/cn'

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

  // Group into sections by h2
  const sections = groupBlocksIntoSections(blocks)

  return (
    <div className="relative font-sans">
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
            // pre-section: blocks before any h2
            return section.blocks.map((block, bIdx) => {
              if (block.type === 'h1') { h1Counter++; h2Counter = 0 }
              return renderBlock(block, sIdx * 1000 + bIdx, undefined, imageSlots)
            })
          }

          // H1 floats ABOVE everything. Content before first H2 → own card. Each H2 → own card below it.
          h2Counter = 0
          const h1Id = `section-${section.heading.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

          // Split blocks into sub-sections by h2
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

              {/* H1 — section header with left border */}
              {(() => { h1Counter++; return null })()}
              <div
                id={h1Id}
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
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#2563EB',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  minWidth: '24px',
                }}>
                  {String(h1Counter).padStart(2, '0')}
                </span>
                <div style={{ width: '1px', height: '20px', background: '#DBEAFE', flexShrink: 0 }} />
                <h1 style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}>
                  {section.heading.content}
                </h1>
              </div>

              {subSections.map((sub, subIdx) => {
                // Skip empty pre-H2 sections
                if (!sub.heading && sub.blocks.filter(b => b.type !== 'empty').length === 0) return null

                if (!sub.heading) {
                  // Content before first H2 → its own white card
                  return (
                    <div key={`pre-${subIdx}`} style={{
                      background: '#fff',
                      border: '1px solid #ECEEF3',
                      borderRadius: '18px',
                      padding: '24px 26px',
                      marginBottom: '14px',
                      boxShadow: '0 1px 2px rgba(16,24,40,.03),0 14px 30px -24px rgba(16,24,40,.18)',
                    }}>
                      {sub.blocks.map((block, bIdx) =>
                        renderBlock(block, sIdx * 1000 + subIdx * 100 + bIdx, undefined, imageSlots)
                      )}
                    </div>
                  )
                }

                // H2 section → H2 label floats above its own white card
                h2Counter++
                const currentNum = h2Counter
                const sectionId = `section-${sub.heading.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

                return (
                  <div key={`sub-${subIdx}`} style={{ marginBottom: '14px' }}>
                    {/* White card containing H2 label + content */}
                    <div id={sectionId} style={{
                      scrollMarginTop: '96px',
                      background: '#fff',
                      border: '1px solid #ECEEF3',
                      borderRadius: '18px',
                      padding: '24px 26px',
                      boxShadow: '0 1px 2px rgba(16,24,40,.03),0 14px 30px -24px rgba(16,24,40,.18)',
                    }}>
                      {/* H2 label — inside the card as header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        marginBottom: '18px',
                      }}>
                        <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: 'linear-gradient(180deg,#3B79FF,#2F6BFF)',
                          color: '#fff', fontSize: '14px', fontWeight: 700,
                          flexShrink: 0, boxShadow: '0 5px 12px -4px rgba(47,107,255,.6)',
                        }}>
                          {currentNum}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '.1em', color: '#2F6BFF' }}>
                          {sub.heading.content.toUpperCase()}
                        </span>
                      </div>

                      {/* H2 content */}
                      {sub.blocks.map((block, bIdx) =>
                        renderBlock(block, sIdx * 1000 + subIdx * 100 + bIdx, undefined, imageSlots)
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

interface Block {
  type: BlockType
  content: string
  rows?: string[][]
  cards?: CardBlock[]
  slotNumber?: number
  slotDescription?: string
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
      // H1 closes any open section, then starts a new section as heading
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

    const imageSlotMatch = line.match(/^\[IMAGE_SLOT:(\d+)\]$/)
    const imageSlotInline = line.match(/^\[IMAGE_SLOT:(\d+)\](.+)\[\/IMAGE_SLOT\]$/)

    if (imageSlotInline) {
      blocks.push({ type: 'image_slot', content: '', slotNumber: parseInt(imageSlotInline[1]), slotDescription: imageSlotInline[2].trim() })
      i++; continue
    }

    if (imageSlotMatch) {
      const slotNum = parseInt(imageSlotMatch[1])
      if (i + 1 < lines.length && lines[i + 1].trim() !== '[/IMAGE_SLOT]' && !lines[i + 1].trim().startsWith('[')) {
        const desc = lines[i + 1].trim()
        if (i + 2 < lines.length && lines[i + 2].trim() === '[/IMAGE_SLOT]') {
          blocks.push({ type: 'image_slot', content: '', slotNumber: slotNum, slotDescription: desc })
          i += 3; continue
        }
      }
      blocks.push({ type: 'image_slot', content: '', slotNumber: slotNum })
      i++; continue
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

function renderBlock(block: Block, key: number, _h2Number?: number, imageSlots: Record<number, string> = {}) {
  switch (block.type) {

    case 'image_slot': {
      const slotNum = block.slotNumber ?? 0
      const imageUrl = imageSlots[slotNum]
      return (
        <div key={key} className="my-6">
          {imageUrl ? (
            <figure className="space-y-2">
              <img
                src={imageUrl}
                alt={block.slotDescription ?? `Image ${slotNum}`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 object-contain max-h-[500px] bg-slate-50 dark:bg-slate-900"
              />
              {block.slotDescription && (
                <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400 italic">
                  {block.slotDescription}
                </figcaption>
              )}
            </figure>
          ) : (
            <div className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 bg-slate-50 dark:bg-slate-900">
              <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <div>
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500">[IMAGE_SLOT:{slotNum}]</p>
                {block.slotDescription && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{block.slotDescription}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    case 'h1': {
      const h1Id = `section-${block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      return (
        <h1 key={key} id={h1Id} style={{
          scrollMarginTop: '96px',
          fontSize: '1.9rem',
          fontWeight: 900,
          color: '#15203A',
          marginTop: '32px',
          marginBottom: '20px',
          letterSpacing: '-0.022em',
          lineHeight: 1.2,
        }}>
          {block.content}
        </h1>
      )
    }

    // h2 is now rendered inline only when it appears in 'pre' sections
    // (normally it's handled by the section renderer above, but just in case)
    case 'h2': {
      const sectionId = `section-${block.content.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      return (
        <div key={key} id={sectionId} style={{ scrollMarginTop: '96px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(180deg,#3B79FF,#2F6BFF)', color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
            ?
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '.1em', color: '#2F6BFF' }}>
            {block.content.toUpperCase()}
          </span>
        </div>
      )
    }

    case 'h3':
      return (
        <h3 key={key} className="text-[1.05rem] font-bold text-slate-800 dark:text-slate-200 mt-8 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
          {block.content}
        </h3>
      )

    case 'highlight':
      return (
        <div key={key} style={{ display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#FFFAED,#FFFDF8)', border: '1px solid #F4E6BC', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#FCEFC4', color: '#D89A06', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>
          </span>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.7, color: '#534820' }}>{renderInline(block.content)}</p>
        </div>
      )

    case 'important':
      return (
        <div key={key} style={{ position: 'relative', overflow: 'hidden', display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#FFF4F3,#FFFAFA)', border: '1px solid #FAD7D3', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#FBDAD6', color: '#DC4842', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#DC4842', marginBottom: '5px' }}>IMPORTANT</div>
            <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#5A4341' }}>{renderInline(block.content)}</p>
          </div>
        </div>
      )

    case 'clinical_pearl':
      return (
        <div key={key} style={{ display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#EEF4FF,#F7FAFF)', border: '1px solid #DCE6FB', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#DCE7FF', color: '#2F6BFF', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#2F6BFF', marginBottom: '5px' }}>CLINICAL PEARL</div>
            <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#39496B' }}>{renderInline(block.content)}</p>
          </div>
        </div>
      )

    case 'must_memorize':
      return (
        <div key={key} style={{ display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#EDFBF4,#F5FDF8)', border: '1px solid #B8EDD3', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#C8F0DC', color: '#138A5A', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#138A5A', marginBottom: '5px' }}>MUST MEMORIZE</div>
            <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, fontWeight: 700, color: '#1A5C3A' }}>{renderInline(block.content)}</p>
          </div>
        </div>
      )

    case 'previous_year':
      return (
        <div key={key} style={{ display: 'flex', gap: '14px', padding: '18px 20px', borderRadius: '14px', background: 'linear-gradient(180deg,#F6F0FF,#FAF7FF)', border: '1px solid #DDD0FA', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '9px', background: '#EDE0FC', color: '#7C3AED', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', color: '#7C3AED', marginBottom: '5px' }}>PREVIOUS YEAR</div>
            <p style={{ margin: 0, fontSize: '15.5px', lineHeight: 1.65, color: '#3D2A6B' }}>{renderInline(block.content)}</p>
          </div>
        </div>
      )

    case 'table':
      if (!block.rows || block.rows.length === 0) return null
      return (
        <div key={key} className="my-6 overflow-x-auto rounded-xl shadow-sm">
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
      return <div key={key} className="h-1" />

    default:
      return (
        <p key={key} style={{ fontSize: '15.5px', lineHeight: 1.75, color: '#3C4661', margin: '0 0 14px' }}>
          {renderInline(block.content)}
        </p>
      )
  }
}