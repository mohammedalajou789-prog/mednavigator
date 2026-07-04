import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// FIX 1: Remove leftover importantIds block (3 lines: the condition + empty button + closing)
// Find the line with "importantIds.size > 0 && ("
const i1 = lines.findIndex(l => l.includes('importantIds.size > 0 && ('))
if (i1 !== -1) {
  // Remove this line + next 3 lines (empty button open, empty button close, closing paren)
  lines[i1] = ''
  lines[i1+1] = ''
  lines[i1+2] = ''
  lines[i1+3] = ''
  console.log('FIX 1 applied at line', i1+1)
} else console.log('MISS 1')

// FIX 2: Insert question text div after Q badge closing </span>
// Find "Q{currentIndex + 1}" line, then its closing </span>, then insert question div + close left div
const i2 = lines.findIndex(l => l.includes('Q{currentIndex + 1}'))
if (i2 !== -1) {
  // i2 is "Q{currentIndex + 1}", i2+1 should be "            </span>"
  // i2+2 should be "          </div>" (closing left div) — replace it with question div + close
  if (lines[i2+2] && lines[i2+2].includes('</div>')) {
    lines[i2+2] = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>{current.question}</div>
          </div>`
    console.log('FIX 2 applied at line', i2+3)
  } else console.log('MISS 2 — closing div not where expected, found:', lines[i2+2])
} else console.log('MISS 2 — Q badge not found')

// FIX 3: Insert SVG into bookmark button — find the empty button line after title="Mark important"
const i3 = lines.findIndex(l => l.includes('title="Mark important"'))
if (i3 !== -1) {
  // Next line after the style line should be empty or have old content
  // The button ends with "> " — we need to add SVG after the style line
  // Find the line index of the closing ">" of the button style
  const styleLineIdx = lines.findIndex((l, idx) => idx >= i3 && l.includes(`transition: 'transform 0.15s' }}>`) )
  if (styleLineIdx !== -1) {
    lines[styleLineIdx] = lines[styleLineIdx] + `<svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
    console.log('FIX 3 applied at line', styleLineIdx+1)
  } else console.log('MISS 3 — style line not found')
} else console.log('MISS 3 — title line not found')

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')