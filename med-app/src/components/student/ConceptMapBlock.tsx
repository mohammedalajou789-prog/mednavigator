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

  // First pass — collect all node definitions and edges
  const edgeLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('TITLE:')) { title = line.slice(6).trim(); continue }
    if (line.startsWith('LAYOUT:') || line.startsWith('GROUP:') || line === 'END_GROUP') continue

    // Detect edges: lines containing -->
    if (line.includes('-->')) {
      edgeLines.push(line)
      // Extract node definitions from edge lines
      const nodeMatches = [...line.matchAll(/(\w+)\["?([^"\]]+)"?\]\((\w+)\)/g)]
      for (const m of nodeMatches) {
        if (!nodeIds.has(m[1])) {
          nodeIds.add(m[1])
          nodes.push({ id: m[1], label: m[2], cat: m[3], row: -1 })
        }
      }
      // Also extract bare node IDs (no definition)
      const bareIds = line.replace(/(\w+)\["?([^"\]]+)"?\]\((\w+)\)/g, '$1')
        .replace(/--[^-]*-->/g, '-->')
        .split('-->').map(s => s.trim())
      for (const id of bareIds) {
        const clean = id.replace(/\(.*\)/, '').trim()
        if (clean && /^\w+$/.test(clean) && !nodeIds.has(clean)) {
          nodeIds.add(clean)
          nodes.push({ id: clean, label: clean, cat: 'neutral', row: -1 })
        }
      }
    }
  }

  // Parse edges
  for (const line of edgeLines) {
    // Normalize: replace node definitions with just IDs
    const normalized = line.replace(/(\w+)\["?([^"\]]+)"?\]\((\w+)\)/g, '$1')
    // Split on arrows
    const arrowMatch = normalized.match(/^(\w+)\s*--([^-]*)?-->\s*(\w+)$/)
    const simpleMatch = normalized.match(/^(\w+)\s*-->\s*(\w+)$/)

    if (arrowMatch) {
      edges.push({ from: arrowMatch[1], to: arrowMatch[3], label: arrowMatch[2].trim() || undefined })
    } else if (simpleMatch) {
      edges.push({ from: simpleMatch[1], to: simpleMatch[2] })
    }
  }

  // Assign rows using topological sort (BFS from roots)
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

  // Treatment and inhibitor nodes with no parent should sit beside their target
  const treatmentCats = new Set(['treatment', 'inhibitor'])
  for (const n of nodes) {
    if (!treatmentCats.has(n.cat)) continue
    if ((inDegree[n.id] ?? 0) !== 0) continue
    // Find the target node this treatment points to
    const targetEdge = edges.find(e => e.from === n.id)
    if (!targetEdge) continue
    const targetRow = rowMap[targetEdge.to]
    if (targetRow !== undefined) rowMap[n.id] = targetRow - 1
  }

  for (const n of nodes) n.row = rowMap[n.id] ?? 0

  return { title, nodes, edges }
}

interface EdgePath {
  d: string
  label?: string
  labelColor?: string
  labelX: number
  labelY: number
}

export default function ConceptMapBlock({ content }: ConceptMapBlockProps) {
  const { title, nodes, edges } = parseMNConceptMap(content)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [paths, setPaths] = useState<EdgePath[]>([])

  // Group nodes by row
  const rowsMap: Record<number, MNNode[]> = {}
  for (const n of nodes) {
    ;(rowsMap[n.row] = rowsMap[n.row] || []).push(n)
  }
  const rows = Object.keys(rowsMap).sort((a, b) => Number(a) - Number(b)).map(k => rowsMap[Number(k)])

  const computePaths = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()

    const computed = edges.map(e => {
      const fromEl = nodeRefs.current[e.from]
      const toEl   = nodeRefs.current[e.to]
      if (!fromEl || !toEl) return null
      const fr = fromEl.getBoundingClientRect()
      const tr = toEl.getBoundingClientRect()
      const x1 = fr.left + fr.width / 2 - cRect.left
      const y1 = fr.bottom - cRect.top
      const x2 = tr.left + tr.width / 2 - cRect.left
      const y2 = tr.top - cRect.top
      const dy = Math.max(20, (y2 - y1) / 2)
      const d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`
      return {
        d,
        label: e.label,
        labelColor: e.label ? (VERB_COLORS[e.label] || '#475569') : undefined,
        labelX: (x1 + x2) / 2,
        labelY: (y1 + y2) / 2,
      }
    }).filter(Boolean) as EdgePath[]

    setPaths(computed)
  }, [edges])

  useEffect(() => {
    const frame = requestAnimationFrame(() => computePaths())
    const timer = setTimeout(() => computePaths(), 300)
    window.addEventListener('resize', computePaths)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      window.removeEventListener('resize', computePaths)
    }
  }, [computePaths, content])

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: '8px', marginBottom: '10px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m0-12.8 2.1 2.1m9.2 9.2 2.1 2.1"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Concept map</span>
        {title && <><span style={{ color: '#BFDBFE' }}>·</span><span style={{ fontSize: '12px', color: '#1E40AF' }}>{title}</span></>}
      </div>

      {/* Diagram */}
      <div style={{ background: '#FAFCFF', border: '1px dashed #D7E6FB', borderRadius: '12px', padding: '28px 20px 20px', position: 'relative' }}>
        {/* SVG arrows layer */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <marker id="mn-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="#94a3b8"/>
            </marker>
          </defs>
          {paths.map((p, i) => (
            <g key={i}>
              <path d={p.d} stroke="#94a3b8" strokeWidth="1.4" fill="none" markerEnd="url(#mn-arrow)"/>
              {p.label && (
                <foreignObject x={p.labelX - 40} y={p.labelY - 11} width="80" height="22" style={{ overflow: 'visible' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2px 8px', fontSize: '10.5px', fontWeight: 700, whiteSpace: 'nowrap', color: p.labelColor ?? '#475569' }}>
                      {p.label}
                    </span>
                  </div>
                </foreignObject>
              )}
            </g>
          ))}
        </svg>

        {/* Nodes layer */}
        <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
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