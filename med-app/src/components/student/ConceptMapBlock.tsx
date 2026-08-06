'use client'
import { useEffect, useRef, useState } from 'react'

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

function parseMNConceptMap(raw: string): { mermaidSrc: string; title: string; layout: string; colorMap: Record<string, string> } {
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
    if (groupMatch) { diagramLines.push(`subgraph "${groupMatch[1]}"`); continue }

    // Parse node color annotations: NODE_ID[Label](colortype)
    // and strip the (colortype) from the Mermaid source
    const processed = line.replace(/(\w+)\[([^\]]+)\]\((\w+)\)/g, (_, id, label, colorType) => {
      colorMap[id] = colorType
      return `${id}["${label}"]`
    })

    // Convert inhibition arrow --inhibits--> to labeled arrow
    const mermaidLine = processed.replace(/--(\w[\w\s]*?)-->/g, '-->|"$1"|')

    diagramLines.push(mermaidLine)
  }

  const direction = layout === 'left-right' ? 'LR' : 'TD'
  const mermaidSrc = `flowchart ${direction}\n${diagramLines.join('\n')}`

  return { mermaidSrc, title, layout, colorMap }
}

export default function ConceptMapBlock({ content }: ConceptMapBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

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
          theme: 'base',
          themeVariables: {
            primaryColor:      dark ? '#26215C' : '#EEEDFE',
            primaryTextColor:  dark ? '#CECBF6' : '#3C3489',
            primaryBorderColor:dark ? '#7F77DD' : '#7F77DD',
            lineColor:         dark ? '#9c9a92' : '#73726c',
            textColor:         dark ? '#c2c0b6' : '#3d3d3a',
            background:        dark ? '#1a1a18' : '#ffffff',
            nodeBorder:        dark ? '#7F77DD' : '#7F77DD',
            clusterBkg:        dark ? '#2C2C2A' : '#F1EFE8',
            clusterBorder:     dark ? '#888780' : '#888780',
            edgeLabelBackground: dark ? '#1a1a18' : '#ffffff',
            fontSize: '13px',
            fontFamily: 'inherit',
          },
          flowchart: {
            curve: 'monotoneX',
            rankSpacing: 60,
            nodeSpacing: 40,
            padding: 16,
          },
        })

        const uniqueId = `cm-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(uniqueId, mermaidSrc)

        if (cancelled) return
        if (!containerRef.current) return

        containerRef.current.innerHTML = svg

        // Apply MedNavigator color palette to nodes
        const svgEl = containerRef.current.querySelector('svg')
        if (svgEl) {
          svgEl.style.maxWidth = '100%'
          svgEl.style.height = 'auto'

          containerRef.current.querySelectorAll('.node').forEach(node => {
            const rawId = node.id ?? ''
            const nodeId = rawId.replace(/^flowchart-/, '').replace(/-\d+$/, '')
            const colorType = colorMap[nodeId]
            if (!colorType) return
            const palette = COLOR_MAP[colorType]
            if (!palette) return

            const shape = node.querySelector('rect, polygon, circle, ellipse')
            if (shape) {
              shape.setAttribute('fill',   dark ? palette.darkFill   : palette.fill)
              shape.setAttribute('stroke', dark ? palette.darkStroke : palette.stroke)
              shape.setAttribute('stroke-width', '1')
              if (shape.tagName === 'rect') shape.setAttribute('rx', '8')
            }
            node.querySelectorAll('text, tspan').forEach(t => {
              t.setAttribute('fill', dark ? palette.darkText : palette.text)
            })
          })

          // Style subgraph containers
          containerRef.current.querySelectorAll('.cluster rect').forEach(r => {
            r.setAttribute('fill',         dark ? '#2a2a28' : '#fafaf8')
            r.setAttribute('stroke',       dark ? '#444441' : '#d3d1c7')
            r.setAttribute('stroke-width', '1')
            r.setAttribute('rx',           '12')
          })
        }

        setRendered(true)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to render concept map')
      }
    }

    render()
    return () => { cancelled = true }
  }, [content])

  const { title } = parseMNConceptMap(content)

  if (error) {
    return (
      <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#FCEBEB', border: '1px solid #E24B4A', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#791F1F', fontFamily: 'monospace' }}>
          Concept map error: {error}
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: '8px', marginBottom: '10px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.3-6.7-2.1 2.1M7.4 16.6l-2.1 2.1m0-12.8 2.1 2.1m9.2 9.2 2.1 2.1"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Concept map</span>
        {title && (
          <>
            <span style={{ color: '#BFDBFE', fontSize: '11px' }}>·</span>
            <span style={{ fontSize: '12px', color: '#1E40AF' }}>{title}</span>
          </>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          width: '100%',
          overflowX: 'auto',
          borderRadius: '12px',
          border: '0.5px solid #ECEEF3',
          background: '#FAFAFA',
          padding: '16px',
          minHeight: rendered ? undefined : '120px',
          display: 'flex',
          alignItems: rendered ? undefined : 'center',
          justifyContent: rendered ? undefined : 'center',
        }}
      >
        {!rendered && !error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Rendering concept map…</span>
          </div>
        )}
      </div>
    </div>
  )
}