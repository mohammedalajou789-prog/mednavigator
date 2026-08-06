'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface ConceptMapBlockProps { content: string }
interface MNNode { id: string; label: string; cat: string; row: number }
interface MNEdge { from: string; to: string; label?: string }
interface MapData { title: string; nodes: MNNode[]; edges: MNEdge[] }
interface RenderedEdge {
  d: string; labelX: number; labelY: number; label?: string; labelColor?: string
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
  inhibits: '#b91c1c', blocks: '#b91c1c', eliminates: '#047857', controls: '#1d4ed8',
}
const TREATMENT_CATS = new Set(['treatment', 'inhibitor'])

function parseMNConceptMap(raw: string): MapData {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  let title = ''
  const nodes: MNNode[] = [], edges: MNEdge[] = []
  const nodeIds = new Set<string>(), edgeLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('TITLE:')) { title = line.slice(6).trim(); continue }
    if (line.startsWith('LAYOUT:') || line.startsWith('GROUP:') || line === 'END_GROUP') continue
    if (!line.includes('-->')) continue
    edgeLines.push(line)
    for (const m of line.matchAll(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g)) {
      if (!nodeIds.has(m[1])) { nodeIds.add(m[1]); nodes.push({ id: m[1], label: m[2], cat: m[3], row: -1 }) }
    }
    for (const part of line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1').replace(/--[^>]*-->/g, '-->').split('-->').map(s => s.trim())) {
      const id = part.replace(/\(.*\)/, '').trim()
      if (id && /^[\w-]+$/.test(id) && !nodeIds.has(id)) { nodeIds.add(id); nodes.push({ id, label: id, cat: 'neutral', row: -1 }) }
    }
  }
  for (const line of edgeLines) {
    const norm = line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
    const m1 = norm.match(/^([\w-]+)\s*--([^>-]*?)-->\s*([\w-]+)$/)
    const m2 = norm.match(/^([\w-]+)\s*-->\s*([\w-]+)$/)
    if (m1) edges.push({ from: m1[1], to: m1[3], label: m1[2].trim() || undefined })
    else if (m2) edges.push({ from: m2[1], to: m2[2] })
  }

  const inDeg: Record<string, number> = {}, adj: Record<string, string[]> = {}
  for (const n of nodes) { inDeg[n.id] = 0; adj[n.id] = [] }
  for (const e of edges) { inDeg[e.to] = (inDeg[e.to] ?? 0) + 1; adj[e.from]?.push(e.to) }
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
  const reg = nodes.filter(n => !TREATMENT_CATS.has(n.cat))
  const trt = nodes.filter(n =>  TREATMENT_CATS.has(n.cat))
  for (const n of reg) n.row = rowOf[n.id] ?? 0
  for (const n of trt) {
    const te = edges.find(e => e.from === n.id)
    n.row = (te ? reg.find(r => r.id === te.to) : undefined)?.row ?? 0
  }
  return { title, nodes, edges }
}

type R = { left: number; right: number; top: number; bottom: number; cx: number; cy: number }
function rr(el: HTMLElement, ref: HTMLElement): R {
  const e = el.getBoundingClientRect(), r = ref.getBoundingClientRect()
  const l = e.left - r.left, t = e.top - r.top
  return { left: l, top: t, right: e.right - r.left, bottom: e.bottom - r.top, cx: l + e.width/2, cy: t + e.height/2 }
}
function b(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1-t; return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
}

/**
 * ROUTING STRATEGY — three cases:
 *
 * A) VERTICAL  (|dy| > 40 OR |dy|/|dx| > 0.75)
 *    ↓ exit bottom → enter top   |   ↑ exit top → enter bottom
 *    Label at bezier t=0.5
 *
 * B) SAME-ROW RIGHT  (dx > 0)
 *    exit right → enter left, straight horizontal spline
 *    Label 14px above midpoint
 *
 * C) SAME-ROW LEFT  (dx < 0)  ← treatment nodes only
 *    Small arch UPWARD: exit top-of-source, arc up by LIFT px, enter top-of-target.
 *    LIFT is clamped so the apex never goes above 10px from wrapper top.
 *    Label sits at the apex of the arch — always in clear space above both nodes.
 *    The wrapper has enough top padding (48px) to always accommodate this arch.
 */
function buildEdge(from: R, to: R, label?: string, labelColor?: string): RenderedEdge {
  const dx = to.cx - from.cx
  const dy = to.cy - from.cy
  const isVertical = Math.abs(dy) > 40 || (Math.abs(dx) > 0 && Math.abs(dy) / Math.abs(dx) > 0.75)

  let x1: number, y1: number, x2: number, y2: number
  let cx1: number, cy1: number, cx2: number, cy2: number
  let labelX: number, labelY: number

  if (isVertical) {
    // ── A ────────────────────────────────────────────────────────────────────
    if (dy >= 0) {
      x1 = from.cx; y1 = from.bottom; x2 = to.cx; y2 = to.top
      const c = Math.max(30, Math.abs(dy) * 0.4)
      cx1 = x1; cy1 = y1 + c; cx2 = x2; cy2 = y2 - c
    } else {
      x1 = from.cx; y1 = from.top; x2 = to.cx; y2 = to.bottom
      const c = Math.max(30, Math.abs(dy) * 0.4)
      cx1 = x1; cy1 = y1 - c; cx2 = x2; cy2 = y2 + c
    }
    labelX = b(0.5, x1, cx1, cx2, x2)
    labelY = b(0.5, y1, cy1, cy2, y2)

  } else if (dx >= 0) {
    // ── B ────────────────────────────────────────────────────────────────────
    x1 = from.right; y1 = from.cy; x2 = to.left; y2 = to.cy
    const c = Math.max(20, Math.abs(dx) * 0.35)
    cx1 = x1 + c; cy1 = y1; cx2 = x2 - c; cy2 = y2
    labelX = b(0.5, x1, cx1, cx2, x2)
    labelY = b(0.5, y1, cy1, cy2, y2) - 14

  } else {
    // ── C: arch upward ───────────────────────────────────────────────────────
    // Both nodes' top edges — we exit/enter from the TOP of each node.
    x1 = from.cx; y1 = from.top
    x2 = to.cx;   y2 = to.top

    const topEdge = Math.min(from.top, to.top)  // highest point of both nodes
    const hDist   = Math.abs(dx)

    // Lift the arch 32px above the highest node, but never above y=10
    const LIFT  = Math.max(28, hDist * 0.3)
    const apex  = Math.max(10, topEdge - LIFT)

    // Symmetric control points: each goes horizontally outward then up to apex
    cx1 = from.cx + hDist * 0.25;  cy1 = apex
    cx2 = to.cx   - hDist * 0.25;  cy2 = apex

    // Label at the apex of the arch (t=0.5 for symmetric curve = apex)
    labelX = b(0.5, x1, cx1, cx2, x2)
    labelY = apex - 10   // 10px above the arch peak → always clear of nodes
  }

  return { d: `M${x1} ${y1} C${cx1} ${cy1},${cx2} ${cy2},${x2} ${y2}`, labelX, labelY, label, labelColor }
}

export default function ConceptMapBlock({ content }: ConceptMapBlockProps) {
  const { title, nodes, edges } = parseMNConceptMap(content)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodeRefs   = useRef<Record<string, HTMLDivElement | null>>({})
  const [re, setRe] = useState<RenderedEdge[]>([])
  const [svgH, setSvgH] = useState(0)

  const rowsMap: Record<number, MNNode[]> = {}
  for (const n of nodes) (rowsMap[n.row] ??= []).push(n)
  const rows = Object.keys(rowsMap).sort((a,b)=>+a - +b).map(k => rowsMap[+k])

  const compute = useCallback(() => {
    const w = wrapperRef.current; if (!w) return
    setSvgH(w.getBoundingClientRect().height)
    setRe(edges.map(e => {
      const fe = nodeRefs.current[e.from], te = nodeRefs.current[e.to]
      if (!fe || !te) return null
      return buildEdge(rr(fe,w), rr(te,w), e.label, e.label ? (VERB_COLORS[e.label] ?? '#475569') : undefined)
    }).filter(Boolean) as RenderedEdge[])
  }, [edges])

  useEffect(() => {
    compute()
    const t1 = setTimeout(compute, 80), t2 = setTimeout(compute, 350)
    const ro = new ResizeObserver(compute)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    window.addEventListener('resize', compute)
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); window.removeEventListener('resize', compute) }
  }, [compute, content])

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
        background:'#EFF6FF', border:'0.5px solid #BFDBFE', borderRadius:8, marginBottom:10,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m0-12.8 2.1 2.1m9.2 9.2 2.1 2.1"/>
        </svg>
        <span style={{ fontSize:11, fontWeight:600, color:'#2563EB', letterSpacing:'0.05em', textTransform:'uppercase' }}>Concept map</span>
        {title && <><span style={{ color:'#BFDBFE' }}>·</span><span style={{ fontSize:12, color:'#1E40AF' }}>{title}</span></>}
      </div>

      <div ref={wrapperRef} style={{
        position:'relative', background:'#FAFCFF',
        border:'1px dashed #D7E6FB', borderRadius:12,
        // top padding must be >= LIFT (32px) to accommodate upward arches
        padding: '48px 24px 28px',
      }}>
        <svg style={{
          position:'absolute', top:0, left:0,
          width:'100%', height: svgH || '100%',
          overflow:'visible', pointerEvents:'none', zIndex:0,
        }}>
          <defs>
            <marker id="mn-arr" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="#94a3b8"/>
            </marker>
            <filter id="lbl-sh" x="-30%" y="-80%" width="160%" height="260%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.07"/>
            </filter>
          </defs>
          {re.map((e,i) => {
            const pw = Math.max(46, (e.label?.length ?? 0) * 6.8 + 18), ph = 19
            return (
              <g key={i}>
                <path d={e.d} fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#mn-arr)"/>
                {e.label && (
                  <g>
                    <rect x={e.labelX-pw/2} y={e.labelY-ph/2} width={pw} height={ph}
                      rx={6} fill="#fff" stroke="#e2e8f0" strokeWidth={1} filter="url(#lbl-sh)"/>
                    <text x={e.labelX} y={e.labelY+4.5} textAnchor="middle"
                      fontSize="10" fontWeight="700" fontFamily="system-ui,sans-serif"
                      fill={e.labelColor ?? '#475569'}>{e.label}</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:40 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
              {row.map(node => {
                const s = CAT_STYLES[node.cat] ?? CAT_STYLES.neutral
                return (
                  <div key={node.id} ref={el => { nodeRefs.current[node.id] = el }} style={{
                    minWidth:130, maxWidth:210, background:s.bg,
                    border:`1.5px solid ${s.border}`, borderLeft:`4px solid ${s.accent}`,
                    borderRadius:9, padding:'9px 13px',
                    boxShadow:'0 1px 3px rgba(15,23,42,0.05)',
                  }}>
                    <div style={{ fontSize:13, fontWeight:700, color:s.text, lineHeight:1.3 }}>
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