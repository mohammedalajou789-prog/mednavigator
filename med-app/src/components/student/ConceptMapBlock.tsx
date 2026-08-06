'use client'
import { useEffect, useState } from 'react'

interface ConceptMapBlockProps {
  content: string
}

const COLOR_MAP: Record<string, { fill: string; stroke: string; text: string; darkFill: string; darkStroke: string; darkText: string }> = {
  trigger:   { fill: '#FAECE7', stroke: '#D85A30', text: '#712B13', darkFill: '#4A1B0C', darkStroke: '#D85A30', darkText: '#F5C4B3' },
  factor:    { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489', darkFill: '#26215C', darkStroke: '#7F77DD', darkText: '#CECBF6' },
  immune:    { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489', darkFill: '#26215C', darkStroke: '#7F77DD', darkText: '#CECBF6' },
  amplify:   { fill: '#FAEEDA', stroke: '#BA7517', text: '#633806', darkFill: '#412402', darkStroke: '#BA7517', darkText: '#FAC775' },
  pathway:   { fill: '#FAEEDA', stroke: '#BA7517', text: '#633806', darkFill: '#412402', darkStroke: '#BA7517', darkText: '#FAC775' },
  pathway2:  { fill: '#E1F5EE', stroke: '#1D9E75', text: '#085041', darkFill: '#04342C', darkStroke: '#1D9E75', darkText: '#9FE1CB' },
  outcome:   { fill: '#EAF3DE', stroke: '#639922', text: '#27500A', darkFill: '#173404', darkStroke: '#639922', darkText: '#C0DD97' },
  inhibitor: { fill: '#FCEBEB', stroke: '#E24B4A', text: '#791F1F', darkFill: '#501313', darkStroke: '#E24B4A', darkText: '#F7C1C1' },
  finding:   { fill: '#E6F1FB', stroke: '#378ADD', text: '#0C447C', darkFill: '#042C53', darkStroke: '#378ADD', darkText: '#B5D4F4' },
  treatment: { fill: '#EAF3DE', stroke: '#639922', text: '#27500A', darkFill: '#173404', darkStroke: '#639922', darkText: '#C0DD97' },
  neutral:   { fill: '#F1EFE8', stroke: '#888780', text: '#444441', darkFill: '#2C2C2A', darkStroke: '#888780', darkText: '#D3D1C7' },
}

function parseMNConceptMap(raw: string): {
  mermaidSrc: string
  title: string
  colorMap: Record<string, string>
} {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  let title = ''
  let layout = 'top-down'
  const colorMap: Record<string, string> = {}
  const diagramLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('TITLE:')) { title = line.slice(6).trim(); continue }
    if (line.startsWith('LAYOUT:')) { layout = line.slice(7).trim(); continue }
    if (line === 'END_GROUP') { diagramLines.push('end'); continue }

    const groupMatch = line.match(/^GROUP:\s*(.+)$/)
    if (groupMatch) {
      diagramLines.push(`subgraph SG${diagramLines.length}["${groupMatch[1]}"]`)
      continue
    }

    const processed = line.replace(/(\w+)\[([^\]]+)\]\((\w+)\)/g, (_full, id, label, colorType) => {
      colorMap[id] = colorType
      return `${id}["${label}"]`
    })

    const mermaidLine = processed.replace(/--([^-]+)-->/g, '-->|"$1"|')
    diagramLines.push(mermaidLine)
  }

  const direction = layout === 'left-right' ? 'LR' : 'TD'
  const mermaidSrc = `flowchart ${direction}\n${diagramLines.join('\n')}`
  return { mermaidSrc, title, colorMap }
}

function applyColors(svgEl: SVGSVGElement, colorMap: Record<string, string>, dark: boolean) {
  svgEl.querySelectorAll('.node').forEach(node => {
    const rawId = (node as Element).id ?? ''
    const nodeId = rawId.replace(/^flowchart-/, '').replace(/-\d+$/, '')
    const colorType = colorMap[nodeId]
    if (!colorType) return
    const palette = COLOR_MAP[colorType]
    if (!palette) return
    const shape = node.querySelector('rect, polygon, circle, ellipse')
    if (shape) {
      shape.setAttribute('fill',         dark ? palette.darkFill   : palette.fill)
      shape.setAttribute('stroke',       dark ? palette.darkStroke : palette.stroke)
      shape.setAttribute('stroke-width', '1')
      if (shape.tagName === 'rect') shape.setAttribute('rx', '8')
    }
    node.querySelectorAll('text, tspan').forEach(t => {
      t.setAttribute('fill', dark ? palette.darkText : palette.text)
    })
  })
  svgEl.querySelectorAll('.cluster rect').forEach(r => {
    r.setAttribute('fill',         dark ? '#2a2a28' : '#fafaf8')
    r.setAttribute('stroke',       dark ? '#444441' : '#d3d1c7')
    r.setAttribute('stroke-width', '1')
    r.setAttribute('rx',           '12')
  })
}

interface SvgResult {
  html: string
  viewW: number
  viewH: number
}

export default function ConceptMapBlock({ content }: ConceptMapBlockProps) {
  const [result, setResult] = useState<SvgResult | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const { title } = parseMNConceptMap(content)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const { default: mermaid } = await import('mermaid')
        const dark = document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches
        const { mermaidSrc, colorMap } = parseMNConceptMap(content)

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          themeVariables: {
            primaryColor:        dark ? '#26215C' : '#EEEDFE',
            primaryTextColor:    dark ? '#CECBF6' : '#3C3489',
            primaryBorderColor:  '#7F77DD',
            lineColor:           dark ? '#9c9a92' : '#73726c',
            textColor:           dark ? '#c2c0b6' : '#3d3d3a',
            background:          dark ? '#1a1a18' : '#ffffff',
            nodeBorder:          '#7F77DD',
            clusterBkg:          dark ? '#2C2C2A' : '#F1EFE8',
            clusterBorder:       dark ? '#888780' : '#888780',
            edgeLabelBackground: dark ? '#1a1a18' : '#ffffff',
            fontSize:            '13px',
            fontFamily:          'inherit',
          },
          flowchart: { curve: 'monotoneX', rankSpacing: 55, nodeSpacing: 35, padding: 14 },
        })

        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden'
        document.body.appendChild(host)

        const uid = `mn-cm-${Date.now()}-${Math.random().toString(36).slice(2)}`

        try {
          const { svg } = await mermaid.render(uid, mermaidSrc, host)
          if (cancelled) return

          const parser = new DOMParser()
          const doc    = parser.parseFromString(svg, 'image/svg+xml')
          const svgEl  = doc.querySelector('svg') as SVGSVGElement | null
          if (!svgEl) { setResult({ html: svg, viewW: 800, viewH: 600 }); return }

          // Read viewBox BEFORE touching anything
          const vbParts = (svgEl.getAttribute('viewBox') ?? '0 0 800 600')
            .split(/[\s,]+/).map(Number)
          const viewW = vbParts[2] || 800
          const viewH = vbParts[3] || 600

          // Apply MedNavigator colors
          applyColors(svgEl, colorMap, dark)

          // Strip ALL size attributes — let the CSS container control size
          svgEl.removeAttribute('width')
          svgEl.removeAttribute('height')
          svgEl.removeAttribute('style')
          svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')

          if (!cancelled) setResult({ html: svgEl.outerHTML, viewW, viewH })
        } finally {
          if (document.body.contains(host)) document.body.removeChild(host)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Render failed')
      }
    }

    render()
    return () => { cancelled = true }
  }, [content])

  if (error) {
    return (
      <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#FCEBEB', border: '1px solid #E24B4A', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#791F1F', fontFamily: 'monospace' }}>Concept map error: {error}</p>
      </div>
    )
  }

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

      {/* Container — aspect-ratio drives the height, SVG fills it */}
      <div style={{
        width: '100%',
        borderRadius: '12px',
        border: '0.5px solid #ECEEF3',
        background: '#FAFAFA',
        padding: '16px',
        boxSizing: 'border-box',
        minHeight: result ? undefined : '100px',
        display: result ? undefined : 'flex',
        alignItems: result ? undefined : 'center',
        justifyContent: result ? undefined : 'center',
      }}>
        {result ? (
          <div
            style={{
              width: '100%',
              aspectRatio: `${result.viewW} / ${result.viewH}`,
              maxHeight: '80vh',
              overflow: 'hidden',
            }}
            dangerouslySetInnerHTML={{ __html: result.html }}
          />
        ) : !error ? (
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Rendering…</span>
        ) : null}
      </div>
    </div>
  )
}