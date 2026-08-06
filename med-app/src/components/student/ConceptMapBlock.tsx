'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface ConceptMapBlockProps {
  content: string
}

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

interface MNNode {
  id: string
  label: string
  cat: string
  row: number
}

interface MNEdge {
  from: string
  to: string
  label?: string
}

interface MapData {
  title: string
  nodes: MNNode[]
  edges: MNEdge[]
}

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

    if (line.includes('-->')) {
      edgeLines.push(line)
      const nodeMatches = [...line.matchAll(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g)]
      for (const m of nodeMatches) {
        if (!nodeIds.has(m[1])) {
          nodeIds.add(m[1])
          nodes.push({ id: m[1], label: m[2], cat: m[3], row: -1 })
        }
      }
      const bareIds = line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
        .replace(/--[^-]*-->/g, '-->')
        .split('-->').map(s => s.trim())
      for (const id of bareIds) {
        const clean = id.replace(/\(.*\)/, '').trim()
        if (clean && /^[\w-]+$/.test(clean) && !nodeIds.has(clean)) {
          nodeIds.add(clean)
          nodes.push({ id: clean, label: clean, cat: 'neutral', row: -1 })
        }
      }
    }
  }

  for (const line of edgeLines) {
    const normalized = line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
    const arrowMatch = normalized.match(/^([\w-]+)\s*--([^-]*)?-->\s*([\w-]+)$/)
    const simpleMatch = normalized.match(/^([\w-]+)\s*-->\s*([\w-]+)$/)

    if (arrowMatch) {
      edges.push({ from: arrowMatch[1], to: arrowMatch[3], label: arrowMatch[2].trim() || undefined })
    } else if (simpleMatch) {
      edges.push({ from: simpleMatch[1], to: simpleMatch[2] })
    }
  }

  const inDegree: Record<string, number> = {}
  const adjList: Record<string, string[]> = {}
  for (const n of nodes) { inDegree[n.id] = 0; adjList[n.id] = [] }
  for (const e of edges) {
    inDegree[e.to] = (inDegree[e.to] ?? 0) + 1
    if (adjList[e.from]) adjList[e.from].push(e.to)
  }

  const queue = nodes.filter(n => (inDegree[n.id] ?? 0) === 0).map(n => n.id)
  const rowMap: Record<string, number> = {}
  for (const id of queue) rowMap[id] = 0

  while (queue.length > 0) {
    const curr = queue.shift()!
    for (const next of (adjList[curr] ?? [])) {
      rowMap[next] = Math.max(rowMap[next] ?? 0, (rowMap[curr] ?? 0) + 1)
      inDegree[next]--
      if (inDegree[next] === 0) queue.push(next)
    }
  }

  const treatmentCats = new Set(['treatment', 'inhibitor'])
  const treatmentNodes = nodes.filter(n => treatmentCats.has(n.cat))
  const regularNodes   = nodes.filter(n => !treatmentCats.has(n.cat))

  for (const n of regularNodes) n.row = rowMap[n.id] ?? 0

  for (const n of treatmentNodes) {
    const targetEdge = edges.find(e => e.from === n.id)
    if (targetEdge) {
      const targetNode = regularNodes.find(r => r.id === targetEdge.to)
      n.row = targetNode !== undefined ? targetNode.row : 0
    } else {
      n.row = 0
    }
  }

  return { title, nodes, edges }
}

interface EdgePath {
  d: string
  label?: string
  labelColor?: string
  labelX: number
  labelY: number
  isHorizontal: boolean
}

export default function ConceptMapBlock({ content }: ConceptMapBlockProps) {
  const { title, nodes, edges } = parseMNConceptMap(content)

  // wrapperRef: the outer relative div that SVG and nodes both live inside
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [paths, setPaths] = useState<EdgePath[]>([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  const rowsMap: Record<number, MNNode[]> = {}
  for (const n of nodes) {
    ;(rowsMap[n.row] = rowsMap[n.row] || []).push(n)
  }
  const rows = Object.keys(rowsMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => rowsMap[Number(k)])

  const computePaths = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const wRect = wrapper.getBoundingClientRect()
    setSvgSize({ w: wRect.width, h: wRect.height })

    const computed = edges.map(e => {
      const fromEl = nodeRefs.current[e.from]
      const toEl   = nodeRefs.current[e.to]
      if (!fromEl || !toEl) return null

      const fr = fromEl.getBoundingClientRect()
      const tr = toEl.getBoundingClientRect()

      // All coordinates relative to wrapper
      const fLeft   = fr.left   - wRect.left
      const fRight  = fr.right  - wRect.left
      const fTop    = fr.top    - wRect.top
      const fBottom = fr.bottom - wRect.top
      const fCx     = fLeft + fr.width / 2
      const fCy     = fTop  + fr.height / 2

      const tLeft   = tr.left   - wRect.left
      const tRight  = tr.right  - wRect.left
      const tTop    = tr.top    - wRect.top
      const tBottom = tr.bottom - wRect.top
      const tCx     = tLeft + tr.width / 2
      const tCy     = tTop  + tr.height / 2

      const dx = tCx - fCx
      const dy = tCy - fCy

      let x1: number, y1: number, x2: number, y2: number
      let cx1: number, cy1: number, cx2: number, cy2: number

      // Determine if connection is primarily vertical or horizontal
      const isVertical = Math.abs(dy) > Math.abs(dx) * 0.6 || Math.abs(dy) >= 30

      if (isVertical) {
        if (dy >= 0) {
          // Target is below source → exit bottom, enter top
          x1 = fCx;  y1 = fBottom
          x2 = tCx;  y2 = tTop
          const ctrl = Math.max(30, Math.abs(y2 - y1) * 0.45)
          cx1 = x1;  cy1 = y1 + ctrl
          cx2 = x2;  cy2 = y2 - ctrl
        } else {
          // Target is above source → exit top, enter bottom
          x1 = fCx;  y1 = fTop
          x2 = tCx;  y2 = tBottom
          const ctrl = Math.max(30, Math.abs(y2 - y1) * 0.45)
          cx1 = x1;  cy1 = y1 - ctrl
          cx2 = x2;  cy2 = y2 + ctrl
        }
      } else {
        if (dx > 0) {
          // Target is to the right → exit right side, enter left side
          x1 = fRight; y1 = fCy
          x2 = tLeft;  y2 = tCy
          const ctrl = Math.max(20, Math.abs(x2 - x1) * 0.4)
          cx1 = x1 + ctrl; cy1 = y1
          cx2 = x2 - ctrl; cy2 = y2
        } else {
          // Target is to the left (treatment on right → target on left)
          // Arc over the top: exit bottom of source, curve up and enter top of target
          x1 = fCx;  y1 = fBottom
          x2 = tCx;  y2 = tTop
          const distX = Math.abs(fCx - tCx)
          // Apex sits above both nodes; clamp so it never goes above 8px from wrapper top
          const apex  = Math.max(8, Math.min(y1, y2) - Math.max(28, distX * 0.45))
          cx1 = fCx + distX * 0.35;  cy1 = apex
          cx2 = tCx - distX * 0.35;  cy2 = apex
        }
      }

      const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`

      // True midpoint at t=0.5 on cubic bezier (apex of the arc)
      const midX = 0.125 * x1 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x2
      const midY = 0.125 * y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * y2

      // For right-to-left arcs the midpoint IS the apex (highest point) — label sits there.
      // For left-to-right horizontal arrows lift label above the straight path.
      // For vertical arrows label sits at midpoint.
      const labelX = midX
      const labelY = (!isVertical && dx > 0) ? midY - 14 : midY

      return {
        d,
        label: e.label,
        labelColor: e.label ? (VERB_COLORS[e.label] ?? '#475569') : undefined,
        labelX,
        labelY,
        isHorizontal: !isVertical,
      }
    }).filter(Boolean) as EdgePath[]

    setPaths(computed)
  }, [edges])

  useEffect(() => {
    // Run immediately, then once more after layout settles
    computePaths()
    const t1 = setTimeout(computePaths, 100)
    const t2 = setTimeout(computePaths, 400)

    const ro = new ResizeObserver(computePaths)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    window.addEventListener('resize', computePaths)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      window.removeEventListener('resize', computePaths)
    }
  }, [computePaths, content])

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 12px',
        background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: '8px',
        marginBottom: '10px',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m0-12.8 2.1 2.1m9.2 9.2 2.1 2.1"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Concept map
        </span>
        {title && (
          <>
            <span style={{ color: '#BFDBFE' }}>·</span>
            <span style={{ fontSize: '12px', color: '#1E40AF' }}>{title}</span>
          </>
        )}
      </div>

      {/* Diagram: single relative wrapper for both SVG and nodes */}
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          background: '#FAFCFF',
          border: '1px dashed #D7E6FB',
          borderRadius: '12px',
          padding: '44px 20px 20px',
        }}
      >
        {/* SVG arrows — positioned to fill the wrapper exactly */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: svgSize.w || '100%',
            height: svgSize.h || '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <defs>
            <marker id="mn-arrow" markerWidth="8" markerHeight="8"
              refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="#94a3b8"/>
            </marker>
            <filter id="pill-shadow" x="-20%" y="-40%" width="140%" height="180%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.06"/>
            </filter>
          </defs>
          {paths.map((p, i) => {
            // Estimate label pill dimensions based on character count
            const charCount  = p.label ? p.label.length : 0
            const pillW      = Math.max(44, charCount * 7 + 16)
            const pillH      = 20
            const pillX      = p.labelX - pillW / 2
            const pillY      = p.labelY - pillH / 2

            return (
              <g key={i}>
                <path d={p.d} stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#mn-arrow)"/>
                {p.label && (
                  <g>
                    {/* White background pill */}
                    <rect
                      x={pillX} y={pillY}
                      width={pillW} height={pillH}
                      rx={7} ry={7}
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth={1}
                      filter="url(#pill-shadow)"
                    />
                    {/* Label text — centred inside pill */}
                    <text
                      x={p.labelX}
                      y={p.labelY + 5}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="inherit"
                      fill={p.labelColor ?? '#475569'}
                    >
                      {p.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* Nodes — stacked rows, z-index above SVG */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {rows.map((row, ri) => (
            <div
              key={ri}
              style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}
            >
              {row.map(node => {
                const s = CAT_STYLES[node.cat] ?? CAT_STYLES.neutral
                return (
                  <div
                    key={node.id}
                    ref={el => { nodeRefs.current[node.id] = el }}
                    style={{
                      minWidth: '140px',
                      maxWidth: '220px',
                      background: s.bg,
                      border: `1.5px solid ${s.border}`,
                      borderLeft: `4px solid ${s.accent}`,
                      borderRadius: '9px',
                      padding: '10px 14px',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                    }}
                  >
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: s.text, lineHeight: 1.3 }}>
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