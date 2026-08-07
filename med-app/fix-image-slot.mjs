import { readFileSync, writeFileSync } from 'fs'

const FILE = 'src/components/student/MNRenderer.tsx'
const lines = readFileSync(FILE, 'utf8').split('\n')
console.log('Lines read:', lines.length)

// ── find all positions BEFORE any modification ────────────────────────────────
const blockInterfaceIdx = lines.findIndex(l => l.trimStart().startsWith('interface Block {'))
const slotDescIdx       = lines.findIndex(l => l.includes('slotDescription?: string'))
const parserStart       = lines.findIndex(l => l.includes('imageSlotMatch = line.match'))
const caseStart         = lines.findIndex(l => l.trim() === "case 'image_slot': {")

let parserEnd = parserStart
for (let k = parserStart + 1; k < lines.length; k++) {
  if (lines[k].includes("'[HIGHLIGHT]'")) {
    parserEnd = k - 1
    while (lines[parserEnd].trim() === '') parserEnd--
    break
  }
}

let caseEnd = caseStart
for (let k = caseStart + 1; k < lines.length; k++) {
  if (lines[k].trim().startsWith("case 'h1':")) {
    caseEnd = k - 1
    while (lines[caseEnd].trim() === '') caseEnd--
    break
  }
}

console.log('interface Block :', blockInterfaceIdx + 1)
console.log('slotDescription :', slotDescIdx + 1)
console.log('parser          :', parserStart + 1, '-', parserEnd + 1)
console.log('case image_slot :', caseStart + 1, '-', caseEnd + 1)

// ── D: new case 'image_slot' renderer ────────────────────────────────────────
const NEW_CASE = [
"    case 'image_slot': {",
"      const slotNum  = block.slotNumber ?? 0",
"      const imageUrl = imageSlots[slotNum]",
"      const FC: Record<string, string> = {",
"        blue: '#2f6fd1', green: '#3f9142', orange: '#b8792a',",
"        purple: '#5b4b8a', red: '#c0392b', amber: '#8a6d3b',",
"        teal: '#1D9E75', pink: '#D4537E', gray: '#888780',",
"      }",
"      const hasExt = !!(block.leftPanel?.length || block.rightPanel?.length || block.figureTitle)",
"",
"      // ── simple backward-compatible render ─────────────────────────────────",
"      if (!hasExt) {",
"        return (",
"          <div key={key} style={{ marginBottom: '20px', border: '1px solid #dde5f0', borderRadius: '16px', overflow: 'hidden', boxShadow: 'rgba(20,30,50,0.06) 0 1px 3px' }}>",
"            {block.slotDescription && (",
"              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'linear-gradient(#f7fafe,#f1f5fc)', borderBottom: '1px solid #dde5f0' }}>",
"                <svg width=\"16\" height=\"16\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"#2f6fd1\" strokeWidth={2}><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"/><path d=\"m21 15-5-5L5 21\"/></svg>",
"                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c2b45' }}>{block.slotDescription}</span>",
"              </div>",
"            )}",
"            <div style={{ background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '120px' }}>",
"              {imageUrl ? (",
"                <div style={{ maxWidth: '100%' }}>",
"                  <ImageLightbox src={imageUrl} alt={block.slotDescription ?? 'Image ' + slotNum} className=\"max-w-full h-auto rounded-xl block\" />",
"                </div>",
"              ) : (",
"                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px' }}>",
"                  <svg width=\"32\" height=\"32\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"#94a3b8\" strokeWidth={1.5}><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"/><path d=\"m21 15-5-5L5 21\"/></svg>",
"                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>{'[IMAGE_SLOT:' + slotNum + ']'}</span>",
"                  {block.slotDescription && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{block.slotDescription}</span>}",
"                </div>",
"              )}",
"            </div>",
"          </div>",
"        )",
"      }",
"",
"      // ── extended: 3-panel figure layout ───────────────────────────────────",
"      return (",
"        <div key={key} style={{ width: '100%', background: 'linear-gradient(#f7fafe,#f1f5fc)', border: '1px solid #dde5f0', borderRadius: '16px', overflow: 'hidden', boxShadow: 'rgba(20,30,50,0.06) 0 1px 3px', marginBottom: '24px' }}>",
"",
"          {block.figureTitle && (",
"            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #dde5f0' }}>",
"              <svg width=\"18\" height=\"18\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"#2f6fd1\" strokeWidth={2}><polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"/></svg>",
"              <h2 style={{ margin: 0, fontSize: '15px', color: '#1c2b45', fontWeight: 700 }}>{block.figureTitle}</h2>",
"            </div>",
"          )}",
"",
"          <div style={{ overflowX: 'auto' }}>",
"            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 220px', gap: '20px', padding: '20px', alignItems: 'stretch', minWidth: '640px' }}>",
"",
"              {block.leftPanel && block.leftPanel.length > 0 && (",
"                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>",
"                  {block.leftPanel.map((item, idx) => {",
"                    const c = FC[item.color] ?? '#2f6fd1'",
"                    return (",
"                      <div key={idx} style={{ display: 'flex', gap: '10px' }}>",
"                        <span style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: c, color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>",
"                          {item.num}",
"                        </span>",
"                        <div>",
"                          <div style={{ fontSize: '13px', fontWeight: 700, color: c }}>{item.title}</div>",
"                          <div style={{ fontSize: '12px', color: '#4b5568', lineHeight: 1.35, marginTop: '2px' }}>{item.desc}</div>",
"                        </div>",
"                      </div>",
"                    )",
"                  })}",
"                </div>",
"              )}",
"",
"              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>",
"                {imageUrl ? (",
"                  <div style={{ maxWidth: '520px', width: '100%' }}>",
"                    <ImageLightbox",
"                      src={imageUrl}",
"                      alt={block.figureTitle ?? block.slotDescription ?? 'Image ' + slotNum}",
"                      className=\"w-full h-auto rounded-xl block\"",
"                    />",
"                  </div>",
"                ) : (",
"                  <div style={{ width: '100%', minHeight: '220px', background: 'rgba(255,255,255,0.6)', border: '1.5px dashed #b9cbe6', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>",
"                    <svg width=\"32\" height=\"32\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"#94a3b8\" strokeWidth={1.5}><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"/><path d=\"m21 15-5-5L5 21\"/></svg>",
"                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>{'[IMAGE_SLOT:' + slotNum + ']'}</span>",
"                  </div>",
"                )}",
"              </div>",
"",
"              {block.rightPanel && block.rightPanel.length > 0 && (",
"                <div style={{ background: '#fff', border: '1px solid #e6ebf3', borderRadius: '12px', padding: '14px 16px' }}>",
"                  {block.rightPanelTitle && (",
"                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>",
"                      <svg width=\"14\" height=\"14\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"#2f6fd1\" strokeWidth={2}><line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"/><line x1=\"3\" y1=\"6\" x2=\"3.01\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"3.01\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"3.01\" y2=\"18\"/></svg>",
"                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c2b45' }}>{block.rightPanelTitle}</span>",
"                    </div>",
"                  )}",
"                  {block.rightPanel.map((item, idx) => {",
"                    const c = FC[item.color] ?? '#2f6fd1'",
"                    return (",
"                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>",
"                        <span style={{ flexShrink: 0, width: '8px', height: '8px', borderRadius: '50%', background: c, marginTop: '5px', display: 'inline-block' }} />",
"                        <span style={{ fontSize: '12px', color: '#2c3547', lineHeight: 1.35 }}>",
"                          <strong style={{ color: c }}>{item.label + ' '}</strong>{item.text}",
"                        </span>",
"                      </div>",
"                    )",
"                  })}",
"                </div>",
"              )}",
"",
"            </div>",
"          </div>",
"",
"          {imageUrl && (",
"            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '4px 20px 16px' }}>",
"              <a href={imageUrl} target=\"_blank\" rel=\"noopener noreferrer\"",
"                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #d7dde8', background: '#fff', color: '#2c3547', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>",
"                <svg width=\"14\" height=\"14\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2}><circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"/></svg>",
"                Zoom",
"              </a>",
"              <a href={imageUrl} download",
"                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #d7dde8', background: '#fff', color: '#2c3547', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>",
"                <svg width=\"14\" height=\"14\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2}><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/></svg>",
"                Download",
"              </a>",
"            </div>",
"          )}",
"",
"          {block.caption && (",
"            <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>",
"              <p style={{ margin: 0, fontSize: '12px', color: '#6b7688', fontStyle: 'italic', lineHeight: 1.4 }}>{block.caption}</p>",
"            </div>",
"          )}",
"",
"        </div>",
"      )",
"    }",
]

// ── C: new imageSlotMatch parser block ────────────────────────────────────────
const NEW_PARSER = [
"    const imageSlotMatch  = line.match(/^\\[IMAGE_SLOT:(\\d+)\\]$/)",
"    const imageSlotInline = line.match(/^\\[IMAGE_SLOT:(\\d+)\\](.+)\\[\\/IMAGE_SLOT\\]$/)",
"",
"    if (imageSlotInline) {",
"      blocks.push({ type: 'image_slot', content: '', slotNumber: parseInt(imageSlotInline[1]), slotDescription: imageSlotInline[2].trim() })",
"      i++; continue",
"    }",
"",
"    if (imageSlotMatch) {",
"      const slotNum = parseInt(imageSlotMatch[1])",
"      const bodyLines: string[] = []",
"      let j = i + 1",
"      while (j < lines.length && lines[j].trim() !== '[/IMAGE_SLOT]') {",
"        bodyLines.push(lines[j])",
"        j++",
"      }",
"      const hasClosingTag = j < lines.length",
"      const body = bodyLines.map(l => l.trim()).join('\\n')",
"",
"      if (body.includes('FIGURE_TITLE:') || body.includes('LEFT_PANEL:') || body.includes('RIGHT_PANEL:')) {",
"        const figureTitle = body.match(/FIGURE_TITLE:\\s*(.+)/)?.[1]?.trim()",
"        const caption     = body.match(/CAPTION:\\s*(.+)/)?.[1]?.trim()",
"",
"        const leftPanel: FigureLeftItem[] = []",
"        const leftBlock = body.match(/LEFT_PANEL:([\\s\\S]*?)(?=RIGHT_PANEL:|CAPTION:|$)/)",
"        if (leftBlock) {",
"          for (const ll of leftBlock[1].split('\\n').map(l => l.trim()).filter(Boolean)) {",
"            const m = ll.match(/^\\[(\\d+)\\|(\\w+)\\]\\s*(.+?)\\s+--\\s+(.+)$/)",
"            if (m) leftPanel.push({ num: +m[1], color: m[2], title: m[3], desc: m[4] })",
"          }",
"        }",
"",
"        const rightPanel: FigureRightItem[] = []",
"        let rightPanelTitle: string | undefined",
"        const rightBlock = body.match(/RIGHT_PANEL:([\\s\\S]*?)(?=CAPTION:|$)/)",
"        if (rightBlock) {",
"          for (const rl of rightBlock[1].split('\\n').map(l => l.trim()).filter(Boolean)) {",
"            const t = rl.match(/^PANEL_TITLE:\\s*(.+)$/)",
"            if (t) { rightPanelTitle = t[1].trim(); continue }",
"            const m = rl.match(/^\\[(\\w+)\\]\\s*(.+?)\\s*=\\s*(.+)$/)",
"            if (m) rightPanel.push({ color: m[1], label: m[2].trim() + ' =', text: m[3].trim() })",
"          }",
"        }",
"",
"        blocks.push({",
"          type: 'image_slot', content: '', slotNumber: slotNum, figureTitle, caption,",
"          leftPanel:      leftPanel.length  ? leftPanel      : undefined,",
"          rightPanel:     rightPanel.length ? rightPanel     : undefined,",
"          rightPanelTitle,",
"        })",
"        i = hasClosingTag ? j + 1 : j; continue",
"      }",
"",
"      // simple: optional single-line description",
"      const desc = bodyLines.find(l => l.trim())?.trim()",
"      blocks.push({ type: 'image_slot', content: '', slotNumber: slotNum, slotDescription: desc })",
"      i = hasClosingTag ? j + 1 : j; continue",
"    }",
]

// ── B: new fields for Block interface ─────────────────────────────────────────
const NEW_FIELDS = [
"  figureTitle?: string",
"  leftPanel?: FigureLeftItem[]",
"  rightPanel?: FigureRightItem[]",
"  rightPanelTitle?: string",
"  caption?: string",
]

// ── A: new interfaces (inserted before Block) ─────────────────────────────────
const NEW_INTERFACES = [
"interface FigureLeftItem {",
"  num: number",
"  color: string",
"  title: string",
"  desc: string",
"}",
"",
"interface FigureRightItem {",
"  color: string",
"  label: string",
"  text: string",
"}",
"",
]

// ── apply changes bottom-to-top (highest line first) ──────────────────────────
lines.splice(caseStart,         caseEnd - caseStart + 1,     ...NEW_CASE)
console.log('D done. Lines now:', lines.length)

lines.splice(parserStart,       parserEnd - parserStart + 1, ...NEW_PARSER)
console.log('C done. Lines now:', lines.length)

lines.splice(slotDescIdx + 1,   0,                           ...NEW_FIELDS)
console.log('B done. Lines now:', lines.length)

lines.splice(blockInterfaceIdx, 0,                           ...NEW_INTERFACES)
console.log('A done. Lines now:', lines.length)

writeFileSync(FILE, lines.join('\n'), 'utf8')
console.log('Done. MNRenderer.tsx updated successfully.')
