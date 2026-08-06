'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface Props    { content: string }
interface MNNode  { id: string; label: string; cat: string; row: number; isTreat: boolean }
interface MNEdge  { from: string; to: string; label?: string }
interface MapData { title: string; nodes: MNNode[]; edges: MNEdge[] }
interface REdge   { d: string; len: number; lx: number; ly: number; label?: string; color: string; fromId: string; toId: string }
type Rect = { l: number; r: number; t: number; b: number; cx: number; cy: number }

/* ══════════════════════════════════════════════════════════════
   STYLE TABLES
══════════════════════════════════════════════════════════════ */
const TREAT_CATS = new Set(['treatment', 'inhibitor'])

const NODE_S: Record<string, { bg: string; border: string; accent: string; text: string }> = {
  trigger:   { bg: '#fff1f2', border: '#fca5a5', accent: '#ef4444', text: '#991b1b' },
  immune:    { bg: '#faf5ff', border: '#d8b4fe', accent: '#9333ea', text: '#6b21a8' },
  amplify:   { bg: '#fffbeb', border: '#fcd34d', accent: '#f59e0b', text: '#92400e' },
  pathway:   { bg: '#fffbeb', border: '#fcd34d', accent: '#f59e0b', text: '#92400e' },
  pathway2:  { bg: '#f0fdf4', border: '#86efac', accent: '#22c55e', text: '#15803d' },
  outcome:   { bg: '#ecfdf5', border: '#6ee7b7', accent: '#10b981', text: '#065f46' },
  finding:   { bg: '#eff6ff', border: '#93c5fd', accent: '#3b82f6', text: '#1e40af' },
  inhibitor: { bg: '#ecfdf5', border: '#6ee7b7', accent: '#10b981', text: '#065f46' },
  treatment: { bg: '#ecfdf5', border: '#6ee7b7', accent: '#10b981', text: '#065f46' },
  factor:    { bg: '#faf5ff', border: '#d8b4fe', accent: '#9333ea', text: '#6b21a8' },
  neutral:   { bg: '#f8fafc', border: '#cbd5e1', accent: '#94a3b8', text: '#475569' },
}

const VERB_CLR: Record<string, string> = {
  reduces:    '#b45309',
  treats:     '#047857',
  activates:  '#1d4ed8',
  inhibits:   '#b91c1c',
  blocks:     '#b91c1c',
  eliminates: '#047857',
  controls:   '#1d4ed8',
}

/* ══════════════════════════════════════════════════════════════
   PARSER  (same logic as original; isTreat flag added)
══════════════════════════════════════════════════════════════ */
function parseMap(raw: string): MapData {
  const lines  = raw.split('\n').map(s => s.trim()).filter(Boolean)
  let title    = ''
  const nodes: MNNode[]  = []
  const edges: MNEdge[]  = []
  const seen   = new Set<string>()
  const eLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('TITLE:')) { title = line.slice(6).trim(); continue }
    if (/^(LAYOUT:|GROUP:|END_GROUP)/.test(line)) continue
    if (!line.includes('-->')) continue
    eLines.push(line)

    for (const m of line.matchAll(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g)) {
      if (!seen.has(m[1])) {
        seen.add(m[1])
        nodes.push({ id: m[1], label: m[2], cat: m[3], row: 0, isTreat: TREAT_CATS.has(m[3]) })
      }
    }
    const plain = line
      .replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
      .replace(/--[^>]*-->/g, '-->')
    for (const part of plain.split('-->').map(s => s.trim())) {
      const id = part.replace(/\(.*\)/, '').trim()
      if (id && /^[\w-]+$/.test(id) && !seen.has(id)) {
        seen.add(id)
        nodes.push({ id, label: id, cat: 'neutral', row: 0, isTreat: false })
      }
    }
  }

  for (const line of eLines) {
    const norm = line.replace(/([\w-]+)\["?([^"\]]+)"?\]\(([\w-]+)\)/g, '$1')
    const m1   = norm.match(/^([\w-]+)\s*--([^>-]*?)-->\s*([\w-]+)$/)
    const m2   = norm.match(/^([\w-]+)\s*-->\s*([\w-]+)$/)
    if (m1) edges.push({ from: m1[1], to: m1[3], label: m1[2].trim() || undefined })
    else if (m2) edges.push({ from: m2[1], to: m2[2] })
  }

  /* ── Topological row assignment (main nodes only) ─────────────── */
  const main  = nodes.filter(n => !n.isTreat)
  const inDeg: Record<string, number>   = {}
  const adj:   Record<string, string[]> = {}
  for (const n of main) { inDeg[n.id] = 0; adj[n.id] = [] }
  for (const e of edges) {
    const sn = nodes.find(n => n.id === e.from)
    const dn = nodes.find(n => n.id === e.to)
    if (!sn?.isTreat && !dn?.isTreat) {
      inDeg[e.to] = (inDeg[e.to] ?? 0) + 1
      adj[e.from]?.push(e.to)
    }
  }
  const q = main.filter(n => !inDeg[n.id]).map(n => n.id)
  const rowOf: Record<string, number> = {}
  for (const id of q) rowOf[id] = 0
  while (q.length) {
    const cur = q.shift()!
    for (const nxt of adj[cur] ?? []) {
      rowOf[nxt] = Math.max(rowOf[nxt] ?? 0, (rowOf[cur] ?? 0) + 1)
      if (--inDeg[nxt] === 0) q.push(nxt)
    }
  }
  for (const n of main) n.row = rowOf[n.id] ?? 0

  /* Treatment nodes: same row as their primary target */
  for (const n of nodes.filter(n => n.isTreat)) {
    const te = edges.find(e => e.from === n.id)
    n.row = (te ? main.find(m => m.id === te.to) : undefined)?.row ?? 0
  }

  return { title, nodes, edges }
}

/* ══════════════════════════════════════════════════════════════
   GEOMETRY HELPERS
══════════════════════════════════════════════════════════════ */
function getRect(el: HTMLElement, wrap: HTMLElement): Rect {
  const e = el.getBoundingClientRect()
  const w = wrap.getBoundingClientRect()
  const l = e.left - w.left, t = e.top - w.top
  return { l, r: e.right - w.left, t, b: e.bottom - w.top, cx: l + e.width / 2, cy: t + e.height / 2 }
}

function bz(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t
  return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d
}

function arcLen(x1: number, y1: number, cx1: number, cy1: number, cx2: number, cy2: number, x2: number, y2: number) {
  let len = 0, px = x1, py = y1
  for (let i = 1; i <= 20; i++) {
    const t = i / 20
    const nx = bz(t, x1, cx1, cx2, x2), ny = bz(t, y1, cy1, cy2, y2)
    len += Math.hypot(nx - px, ny - py); px = nx; py = ny
  }
  return len
}

/* ══════════════════════════════════════════════════════════════
   EDGE ROUTING  — three clean cases, no upward arches
   ─────────────────────────────────────────────────────────────
   A  TREAT → MAIN
      Treatment nodes are always in the RIGHT column.
      Exit treatment.LEFT  →  enter target.RIGHT.
      Same row: horizontal S-curve.
      Different row: diagonal bezier (exit horizontal, arrive at target height).
      Label: 24 px above bezier midpoint — always in the clear gap.

   B  VERTICAL  (|dy| > 35 or slope > 0.65)
      Exit source bottom/top  →  enter dest top/bottom.
      Label: at bezier midpoint (open space between rows).

   C  HORIZONTAL  (same-row main → main)
      Exit source right/left  →  enter dest left/right.
      Label: 14 px above midpoint.
══════════════════════════════════════════════════════════════ */
function buildEdge(
  src: Rect, dst: Rect,
  isTreat: boolean,
  fromId: string, toId: string,
  label?: string,
): REdge {
  const dx = dst.cx - src.cx
  const dy = dst.cy - src.cy
  const lc = label ? (VERB_CLR[label] ?? '#64748b') : '#94a3b8'
  let x1: number, y1: number, x2: number, y2: number
  let cx1: number, cy1: number, cx2: number, cy2: number
  let lx: number, ly: number

  /* ── A: Treatment → main ──────────────────────────────────────── */
  if (isTreat) {
    x1 = src.l;  y1 = src.cy        // exit LEFT of treatment node
    x2 = dst.r;  y2 = dst.cy        // enter RIGHT of target node
    const hs = Math.abs(x1 - x2)    // x1 > x2 (treatment is on the right)

    if (Math.abs(dy) < 22) {
      // Same row: smooth S-curve stays horizontal
      const c = Math.max(24, hs * 0.38)
      cx1 = x1 - c; cy1 = y1
      cx2 = x2 + c; cy2 = y2
    } else {
      // Different row: exit horizontally, then curve to target's height
      cx1 = x1 - hs * 0.44; cy1 = y1
      cx2 = x2 + hs * 0.20; cy2 = y2
    }

    lx = bz(0.5, x1, cx1, cx2, x2)
    ly = bz(0.5, y1, cy1, cy2, y2) - 24

  /* ── B / C: Main → main ───────────────────────────────────────── */
  } else {
    const isV = Math.abs(dy) > 35 || (Math.abs(dx) > 1 && Math.abs(dy) / Math.abs(dx) > 0.65)

    if (isV) {
      // Vertical
      if (dy >= 0) {
        x1 = src.cx; y1 = src.b; x2 = dst.cx; y2 = dst.t
        const c = Math.max(30, Math.abs(dy) * 0.4)
        cx1 = x1; cy1 = y1 + c; cx2 = x2; cy2 = y2 - c
      } else {
        x1 = src.cx; y1 = src.t; x2 = dst.cx; y2 = dst.b
        const c = Math.max(30, Math.abs(dy) * 0.4)
        cx1 = x1; cy1 = y1 - c; cx2 = x2; cy2 = y2 + c
      }
      lx = bz(0.5, x1, cx1, cx2, x2)
      ly = bz(0.5, y1, cy1, cy2, y2)

    } else if (dx >= 0) {
      // Horizontal right
      x1 = src.r; y1 = src.cy; x2 = dst.l; y2 = dst.cy
      const c = Math.max(20, dx * 0.35)
      cx1 = x1 + c; cy1 = y1; cx2 = x2 - c; cy2 = y2
      lx = bz(0.5, x1, cx1, cx2, x2)
      ly = bz(0.5, y1, cy1, cy2, y2) - 14

    } else {
      // Horizontal left
      x1 = src.l; y1 = src.cy; x2 = dst.r; y2 = dst.cy
      const c = Math.max(20, -dx * 0.35)
      cx1 = x1 - c; cy1 = y1; cx2 = x2 + c; cy2 = y2
      lx = bz(0.5, x1, cx1, cx2, x2)
      ly = bz(0.5, y1, cy1, cy2, y2) - 14
    }
  }

  const len = arcLen(x1, y1, cx1, cy1, cx2, cy2, x2, y2)
  return {
    d: `M${x1} ${y1} C${cx1} ${cy1},${cx2} ${cy2},${x2} ${y2}`,
    len, lx, ly, label, color: lc, fromId, toId,
  }
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ConceptMapBlock({ content }: Props) {
  const { title, nodes, edges } = parseMap(content)

  const wrapRef  = useRef<HTMLDivElement>(null)
  const nRefs    = useRef<Record<string, HTMLDivElement | null>>({})
  const initDone = useRef(false)
  const [re, setRe]       = useState<REdge[]>([])
  const [svgH, setSvgH]   = useState(0)
  const [hov, setHov]     = useState<string | null>(null)
  const [drawn, setDrawn] = useState(false)

  const nMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  /* Group nodes by row → { main, treat } */
  const rowMap: Record<number, { main: MNNode[]; treat: MNNode[] }> = {}
  for (const n of nodes) {
    if (!rowMap[n.row]) rowMap[n.row] = { main: [], treat: [] }
    n.isTreat ? rowMap[n.row].treat.push(n) : rowMap[n.row].main.push(n)
  }
  const rows = Object.keys(rowMap).sort((a, b) => +a - +b).map(k => rowMap[+k])
  const hasAnyTreat = rows.some(r => r.treat.length > 0)

  /* Hover: connected node IDs */
  const connSet = hov
    ? new Set(edges.flatMap(e => (e.from === hov || e.to === hov) ? [e.from, e.to] : []))
    : null

  /* Compute edge paths from live DOM measurements */
  const compute = useCallback(() => {
    const w = wrapRef.current
    if (!w) return
    setSvgH(w.getBoundingClientRect().height)
    const res: REdge[] = []
    for (const e of edges) {
      const fe = nRefs.current[e.from]
      const te = nRefs.current[e.to]
      if (!fe || !te) continue
      res.push(buildEdge(getRect(fe, w), getRect(te, w), nMap[e.from]?.isTreat ?? false, e.from, e.to, e.label))
    }
    setRe(res)
    /* Trigger draw animation exactly once after first measurement */
    if (!initDone.current) {
      initDone.current = true
      setTimeout(() => setDrawn(true), 60)
    }
  }, [edges, nMap])

  useEffect(() => {
    compute()
    const t1 = setTimeout(compute, 80)
    const t2 = setTimeout(compute, 350)
    const ro = new ResizeObserver(compute)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', compute)
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); window.removeEventListener('resize', compute) }
  }, [compute, content])

  return (
    <div style={{ marginBottom: 20, fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px',
        background: 'linear-gradient(135deg,#EFF6FF,#F0F9FF)',
        border: '0.5px solid #BFDBFE', borderRadius: 8, marginBottom: 10,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m0-12.8 2.1 2.1m9.2 9.2 2.1 2.1"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Concept Map
        </span>
        {title && (
          <>
            <span style={{ color: '#BFDBFE', fontSize: 14 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#1E40AF' }}>{title}</span>
          </>
        )}
        {hasAnyTreat && (
          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
            ⚕ Treatments
          </span>
        )}
      </div>

      {/* ── Canvas ──────────────────────────────────────────────── */}
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          background: '#FAFCFF',
          border: '1px solid #E8F0FE',
          borderRadius: 14,
          padding: '28px 20px',
          boxShadow: 'inset 0 1px 3px rgba(59,130,246,0.04)',
        }}
      >
        {/* Subtle dot-grid background */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14,
          zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle,#c7d2e0 1px,transparent 1px)',
          backgroundSize: '24px 24px', opacity: 0.3,
        }}/>

        {/* ── SVG edge layer ─────────────────────────────────────── */}
        <svg style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: svgH || '100%',
          overflow: 'visible', pointerEvents: 'none', zIndex: 1,
        }}>
          <defs>
            <marker id="mn-arr" markerWidth="7" markerHeight="7"
              refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="#94a3b8"/>
            </marker>
            <filter id="lbl-sh" x="-28%" y="-60%" width="156%" height="220%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.10"/>
            </filter>
          </defs>

          {re.map((e, i) => {
            const isConn = !hov || connSet?.has(e.fromId) || connSet?.has(e.toId)
            const isHi   = !!hov && connSet?.has(e.fromId) && connSet?.has(e.toId)
            const pw     = Math.max(52, (e.label?.length ?? 0) * 7 + 20)
            const ph     = 20

            return (
              <g key={i} opacity={hov ? (isConn ? 1 : 0.1) : 1} style={{ transition: 'opacity 0.2s' }}>
                <path
                  d={e.d} fill="none"
                  stroke={isHi ? e.color : '#94a3b8'}
                  strokeWidth={isHi ? 2 : 1.5}
                  strokeDasharray={e.len}
                  strokeDashoffset={drawn ? 0 : e.len}
                  markerEnd="url(#mn-arr)"
                  style={{
                    transition: drawn
                      ? `stroke-dashoffset .55s ease ${i * 0.07}s, stroke .2s, stroke-width .2s`
                      : 'none',
                  }}
                />
                {e.label && (
                  <g filter="url(#lbl-sh)">
                    <rect
                      x={e.lx - pw / 2} y={e.ly - ph / 2}
                      width={pw} height={ph} rx={7}
                      fill="#ffffff" stroke="#e2e8f0" strokeWidth={1}
                    />
                    <text
                      x={e.lx} y={e.ly + 5.5}
                      textAnchor="middle" fontSize="10" fontWeight="700"
                      fontFamily="system-ui,sans-serif" fill={e.color}
                    >
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* ── Node rows ──────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 36 }}>
          {rows.map(({ main, treat }, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center' }}>

              {/* Main pathway — centred, wraps if needed */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {main.map(n => (
                  <NodeCard
                    key={n.id} node={n}
                    dim={!!hov && !connSet?.has(n.id)}
                    highlight={!!hov && !!connSet?.has(n.id)}
                    setRef={el => { nRefs.current[n.id] = el }}
                    onEnter={() => setHov(n.id)}
                    onLeave={() => setHov(null)}
                  />
                ))}
              </div>

              {/* Separator + right treatment column */}
              {treat.length > 0 && (
                <>
                  <div style={{
                    width: 1, alignSelf: 'stretch', margin: '4px 20px', flexShrink: 0,
                    background: 'linear-gradient(to bottom,transparent,#cbd5e145 30%,#cbd5e165 70%,transparent)',
                  }}/>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                    {treat.map(n => (
                      <NodeCard
                        key={n.id} node={n}
                        dim={!!hov && !connSet?.has(n.id)}
                        highlight={!!hov && !!connSet?.has(n.id)}
                        setRef={el => { nRefs.current[n.id] = el }}
                        onEnter={() => setHov(n.id)}
                        onLeave={() => setHov(null)}
                      />
                    ))}
                  </div>
                </>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   NODE CARD
══════════════════════════════════════════════════════════════ */
interface NCProps {
  node:      MNNode
  dim:       boolean
  highlight: boolean
  setRef:    (el: HTMLDivElement | null) => void
  onEnter:   () => void
  onLeave:   () => void
}

function NodeCard({ node, dim, highlight, setRef, onEnter, onLeave }: NCProps) {
  const s = NODE_S[node.cat] ?? NODE_S.neutral

  return (
    <div
      ref={setRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position:   'relative',
        minWidth:   node.isTreat ? 118 : 128,
        maxWidth:   node.isTreat ? 172 : 210,
        background: s.bg,
        border:     `1.5px solid ${highlight ? s.accent : s.border}`,
        borderLeft: `4px solid ${s.accent}`,
        // Pill shape for treatment nodes; card shape for pathway nodes
        borderRadius: node.isTreat ? 24 : 10,
        padding:    node.isTreat ? '8px 14px' : '9px 13px',
        boxShadow:  highlight
          ? `0 0 0 3px ${s.accent}28, 0 3px 10px rgba(15,23,42,.13)`
          : '0 1px 4px rgba(15,23,42,.06)',
        opacity:    dim ? 0.28 : 1,
        cursor:     'default',
        transition: 'opacity .2s, box-shadow .2s, border-color .2s',
      }}
    >
      {/* Rx badge — treatment nodes only */}
      {node.isTreat && (
        <span style={{
          position:   'absolute',
          top:        -8,
          right:      10,
          fontSize:   8,
          fontWeight: 800,
          color:      '#fff',
          background: s.accent,
          borderRadius: 4,
          padding:    '2px 5px',
          letterSpacing: '.04em',
          boxShadow:  '0 1px 3px rgba(0,0,0,.2)',
          lineHeight: 1.5,
        }}>
          Rx
        </span>
      )}

      <div style={{
        fontSize:   13,
        fontWeight: 700,
        color:      s.text,
        lineHeight: 1.3,
        textAlign:  node.isTreat ? 'center' : 'left',
      }}>
        {node.label}
      </div>
    </div>
  )
}