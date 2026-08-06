'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConceptMapBlockProps { content: string }

interface MNNode { id: string; label: string; cat: string; row: number }
interface MNEdge { from: string; to: string; label?: string }
interface MapData { title: string; nodes: MNNode[]; edges: MNEdge[] }

interface RenderedEdge {
  d: string          // SVG path
  labelX: number
  labelY: number
  label?: string
  labelColor?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_STYLES: Record<string, { bg: string; border: string; accent: string; text: string }> = {
  trigger:   { bg: '#fef2f2', border: '#fca5a5', accent: '#ef4444', text: '#b91c1c' },
  immune:    { bg: '#faf5ff', border: '#d8b4fe', accent: '#9333ea', text: '#6b21a8' },
  amplify:   { bg: '#fffbeb', border: '#fcd34d', accent: '#f59e0b', text: '#b45309' },
  pathway:   { bg: '#fffbeb', border: '#fcd34d', accent: '#f59e0b', text: '#b45309' },
  pathway2:  { bg: '#f0fdf4', border: '#86efac', accent: '#22c55e', text: '#15803d' },
  outcome:   { bg: '#ecfdf5', border: '#6ee7b7', accent: '#10b981', text: '#047857' },
  finding:   { bg: '#eff6ff', border: '#93c5fd', accent: '#3b82f6', text: '#1d4ed8' },
  inhibitor: { bg: '#fef2f2', border: '#fca5a5', accent: '#ef4444', text: '#b91c1c' },
  treatment: { bg: '#ecfdf5', border: '#6ee7b7', accent: '#10b981', text: '#047857' },
  factor:    { bg: '#faf5ff', border: '#d8b4fe', accent: '#9333ea', text: '#6b21a8' },
  neutral:   { bg: '#f8fafc', border: '#cbd5e1', accent: '#94a3b8', text: '#475569' },
}

const VERB_COLORS: Record<string, string> = {
  reduces: '#b45309', treats: '#047857', activates: '#1d4ed8',
  inhibits: '#b91c1c', blocks: '#b91c1c', eliminates: '#047857',
  controls: '#1d4ed8',
}

const TREATMENT_CATS = new Set(['treatment', 'inhibitor'])

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseMNConceptMap(raw: string): MapData {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  let title = ''
  const nodes: MNNode[] = []
  const edges: MNEdge[] = []
  const nodeIds = new Set<string>()
  const edgeLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('TITLE:')) { title = line.slice(6).trim(); continue }
    if (line.startsWith('LAYOUT:') || line.startsWith('GROUP:') || line === 'END_GROUP') continue
    if (!line.includes('-->')) continue
    edgeLines.push(line)

    // Extract inline node definitions: ID["Label"](cat) or ID[Label](cat)
    const nodeMatches = [...line.matchAll(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g)]
    for (const m of nodeMatches) {
      if (!nodeIds.has(m[1])) {
        nodeIds.add(m[1])
        nodes.push({ id: m[1], label: m[2], cat: m[3], row: -1 })
      }
    }

    // Collect bare IDs that appear without inline definitions
    const stripped = line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
    const parts = stripped.replace(/--[^>]*-->/g, '-->').split('-->').map(s => s.trim())
    for (const part of parts) {
      const id = part.replace(/\(.*\)/, '').trim()
      if (id && /^[\w-]+$/.test(id) && !nodeIds.has(id)) {
        nodeIds.add(id)
        nodes.push({ id, label: id, cat: 'neutral', row: -1 })
      }
    }
  }

  // Build edges
  for (const line of edgeLines) {
    const norm = line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
    const m1 = norm.match(/^([\w-]+)\s*--([^>-]*?)-->\s*([\w-]+)$/)
    const m2 = norm.match(/^([\w-]+)\s*-->\s*([\w-]+)$/)
    if (m1) edges.push({ from: m1[1], to: m1[3], label: m1[2].trim() || undefined })
    else if (m2) edges.push({ from: m2[1], to: m2[2] })
  }

  // Topological row assignment for non-treatment nodes
  const inDeg: Record<string, number> = {}
  const adj:   Record<string, string[]> = {}
  for (const n of nodes) { inDeg[n.id] = 0; adj[n.id] = [] }
  for (const e of edges) {
    inDeg[e.to] = (inDeg[e.to] ?? 0) + 1
    adj[e.from]?.push(e.to)
  }

  const queue = nodes.filter(n => !inDeg[n.id]).map(n => n.id)
  const rowOf: Record<string, number> = {}
  for (const id of queue) rowOf[id] = 0
  while (queue.length) {
    const cur = queue.shift()!
    for (const nxt of adj[cur] ?? []) {
      rowOf[nxt] = Math.max(rowOf[nxt] ?? 0, (rowOf[cur] ?? 0) + 1)
      if (--inDeg[nxt] === 0) queue.push(nxt)
    }
  }

  const regularNodes  = nodes.filter(n => !TREATMENT_CATS.has(n.cat))
  const treatmentNodes = nodes.filter(n => TREATMENT_CATS.has(n.cat))

  for (const n of regularNodes) n.row = rowOf[n.id] ?? 0

  // Treatment nodes sit on same row as their target
  for (const n of treatmentNodes) {
    const targetEdge = edges.find(e => e.from === n.id)
    if (targetEdge) {
      const target = regularNodes.find(r => r.id === targetEdge.to)
      n.row = target?.row ?? 0
    } else {
      n.row = 0
    }
  }

  return { title, nodes, edges }
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/** Bounding rect of an element relative to a reference element */
function relRect(el: HTMLElement, ref: HTMLElement) {
  const er = el.getBoundingClientRect()
  const rr = ref.getBoundingClientRect()
  return {
    left:   er.left   - rr.left,
    right:  er.right  - rr.left,
    top:    er.top    - rr.top,
    bottom: er.bottom - rr.top,
    cx:     er.left   - rr.left + er.width  / 2,
    cy:     er.top    - rr.top  + er.height / 2,
    w:      er.width,
    h:      er.height,
  }
}

/** Cubic bezier point at t */
function bezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
}

/**
 * Build an SVG cubic-bezier path between two rects.
 *
 * Strategy:
 *  - VERTICAL (source above/below target, or dy large): exit bottom/top, enter top/bottom.
 *  - HORIZONTAL-RIGHT (source left of target): exit right, enter left.
 *  - HORIZONTAL-LEFT (treatment on right, target on left):
 *      Draw a smooth arc that exits the TOP of source, curves above both nodes,
 *      and enters the TOP of target. The label floats at the apex of the arc.
 *
 * This avoids the arrow-reversal problem completely because we never try to
 * enter the target from its right side.
 */
function buildEdge(
  from: ReturnType<typeof relRect>,
  to:   ReturnType<typeof relRect>,
  label?: string,
  labelColor?: string,
): RenderedEdge {
  const dx = to.cx - from.cx
  const dy = to.cy - from.cy

  // Treat as vertical when target is clearly above or below
  const isVertical = Math.abs(dy) > 50 || Math.abs(dy) > Math.abs(dx) * 0.7

  let x1: number, y1: number, x2: number, y2: number
  let cx1: number, cy1: number, cx2: number, cy2: number

  if (isVertical) {
    if (dy >= 0) {
      // ↓ target is below
      x1 = from.cx; y1 = from.bottom
      x2 = to.cx;   y2 = to.top
      const c = Math.max(30, Math.abs(dy) * 0.4)
      cx1 = x1; cy1 = y1 + c
      cx2 = x2; cy2 = y2 - c
    } else {
      // ↑ target is above
      x1 = from.cx; y1 = from.top
      x2 = to.cx;   y2 = to.bottom
      const c = Math.max(30, Math.abs(dy) * 0.4)
      cx1 = x1; cy1 = y1 - c
      cx2 = x2; cy2 = y2 + c
    }
  } else if (dx >= 0) {
    // → target is to the right
    x1 = from.right; y1 = from.cy
    x2 = to.left;    y2 = to.cy
    const c = Math.max(20, Math.abs(dx) * 0.4)
    cx1 = x1 + c; cy1 = y1
    cx2 = x2 - c; cy2 = y2
  } else {
    // ← treatment on right, target on left
    // Arc over the top: exit from.top, curve upward, enter to.top
    x1 = from.cx; y1 = from.top
    x2 = to.cx;   y2 = to.top

    const hDist = Math.abs(dx)  // horizontal distance between centres
    // The apex Y is above whichever node is higher, plus extra clearance
    const topEdge = Math.min(from.top, to.top)
    const apex    = Math.max(4, topEdge - Math.max(28, hDist * 0.4))

    // Control points go outward horizontally from each node's centre
    // then up to the apex, creating a smooth arch
    cx1 = from.cx + hDist * 0.3;  cy1 = apex
    cx2 = to.cx   - hDist * 0.3;  cy2 = apex
  }

  const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`

  // Label position: true midpoint of the bezier (t = 0.5)
  const lx = bezier(0.5, x1, cx1, cx2, x2)
  const ly = bezier(0.5, y1, cy1, cy2, y2)

  // For right-to-left arcs the midpoint IS the apex → no extra shift needed.
  // For right arrows the midpoint is on the flat segment → lift slightly.
  const labelX = lx
  const labelY = (isVertical || dx < 0) ? ly : ly - 13

  return { d, labelX, labelY, label, labelColor }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConceptMapBlock({ content }: ConceptMapBlockProps) {
  const { title, nodes, edges } = parseMNConceptMap(content)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodeRefs   = useRef<Record<string, HTMLDivElement | null>>({})
  const [renderedEdges, setRenderedEdges] = useState<RenderedEdge[]>([])
  const [svgH, setSvgH] = useState(0)

  // Group nodes into display rows
  const rowsMap: Record<number, MNNode[]> = {}
  for (const n of nodes) (rowsMap[n.row] ??= []).push(n)
  const rows = Object.keys(rowsMap)
    .sort((a, b) => +a - +b)
    .map(k => rowsMap[+k])

  const compute = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    setSvgH(wrapper.getBoundingClientRect().height)

    const built = edges.map(e => {
      const fromEl = nodeRefs.current[e.from]
      const toEl   = nodeRefs.current[e.to]
      if (!fromEl || !toEl) return null
      const f = relRect(fromEl, wrapper)
      const t = relRect(toEl,   wrapper)
      const color = e.label ? (VERB_COLORS[e.label] ?? '#475569') : undefined
      return buildEdge(f, t, e.label, color)
    }).filter(Boolean) as RenderedEdge[]

    setRenderedEdges(built)
  }, [edges])

  useEffect(() => {
    compute()
    const t1 = setTimeout(compute, 80)
    const t2 = setTimeout(compute, 350)
    const ro = new ResizeObserver(compute)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    window.addEventListener('resize', compute)
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); window.removeEventListener('resize', compute) }
  }, [compute, content])

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px',
        background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: 8,
        marginBottom: 10,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m0-12.8 2.1 2.1m9.2 9.2 2.1 2.1"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Concept map
        </span>
        {title && <>
          <span style={{ color: '#BFDBFE' }}>·</span>
          <span style={{ fontSize: 12, color: '#1E40AF' }}>{title}</span>
        </>}
      </div>

      {/* ── Diagram wrapper (SVG + nodes share the same coordinate space) ── */}
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          background: '#FAFCFF',
          border: '1px dashed #D7E6FB',
          borderRadius: 12,
          // Extra top padding gives room for arcs that arc above the first row
          padding: '52px 24px 24px',
        }}
      >
        {/* SVG layer — sits behind nodes (zIndex 0) */}
        <svg
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: svgH || '100%',
            overflow: 'visible', pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <defs>
            <marker id="mn-arr" markerWidth="7" markerHeight="7"
              refX="5.5" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="#94a3b8"/>
            </marker>
            <filter id="lbl-shadow" x="-25%" y="-50%" width="150%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1"
                floodColor="#0f172a" floodOpacity="0.07"/>
            </filter>
          </defs>

          {renderedEdges.map((e, i) => {
            const chars  = e.label?.length ?? 0
            const pillW  = Math.max(46, chars * 6.8 + 18)
            const pillH  = 19
            return (
              <g key={i}>
                <path d={e.d} fill="none" stroke="#94a3b8"
                  strokeWidth="1.5" markerEnd="url(#mn-arr)"/>
                {e.label && (
                  <g>
                    <rect
                      x={e.labelX - pillW / 2} y={e.labelY - pillH / 2}
                      width={pillW} height={pillH} rx={6} ry={6}
                      fill="#fff" stroke="#e2e8f0" strokeWidth={1}
                      filter="url(#lbl-shadow)"
                    />
                    <text
                      x={e.labelX} y={e.labelY + 4.5}
                      textAnchor="middle"
                      fontSize="10" fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      fill={e.labelColor ?? '#475569'}
                    >
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* Nodes layer — sits above SVG (zIndex 1) */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {row.map(node => {
                const s = CAT_STYLES[node.cat] ?? CAT_STYLES.neutral
                return (
                  <div
                    key={node.id}
                    ref={el => { nodeRefs.current[node.id] = el }}
                    style={{
                      minWidth: 130, maxWidth: 210,
                      background: s.bg,
                      border: `1.5px solid ${s.border}`,
                      borderLeft: `4px solid ${s.accent}`,
                      borderRadius: 9,
                      padding: '9px 13px',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.text, lineHeight: 1.3 }}>
                      {node.label}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}