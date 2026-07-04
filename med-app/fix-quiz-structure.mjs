import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// FIX 1: Line 220 (index 219) — replace premature </div> with question text div
// Current: "          </div>"  (closes left column too early)
// Target: insert question text here, then close left column
const i1 = lines.findIndex(l => l.includes(`Q{currentIndex + 1}`))
if (i1 !== -1) {
  // i1   = Q{currentIndex + 1} line
  // i1+1 = </span>
  // i1+2 = </div>  ← this closes left column too early, replace it
  if (lines[i1+2] && lines[i1+2].trimEnd() === '          </div>') {
    lines[i1+2] = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>{current.question}</div>
          </div>`
    console.log('FIX 1 applied')
  } else {
    console.log('MISS 1 — found:', JSON.stringify(lines[i1+2]))
  }
} else console.log('MISS 1 — Q badge not found')

// FIX 2: Remove the misplaced question div that ended up after the header (lines 228-229)
const i2 = lines.findIndex(l => l.includes(`fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)'`))
if (i2 !== -1) {
  // Remove this line and the next line {current.question}
  lines[i2] = ''
  if (lines[i2+1] && lines[i2+1].includes('{current.question}')) {
    lines[i2+1] = ''
    console.log('FIX 2 applied')
  } else {
    console.log('FIX 2 partial — next line:', JSON.stringify(lines[i2+1]))
  }
} else console.log('MISS 2')

// FIX 3: Remove leftover emoji line after SVG bookmark button
const i3 = lines.findIndex(l => l.includes(`'âگ' : 'âک†'`))
if (i3 !== -1) {
  lines[i3] = ''
  console.log('FIX 3 applied')
} else {
  // Try finding by partial match
  const i3b = lines.findIndex(l => l.includes('isCurrentImportant ?') && l.includes("': '") && !l.includes('fill='))
  if (i3b !== -1) {
    lines[i3b] = ''
    console.log('FIX 3 applied via fallback at line', i3b+1)
  } else console.log('MISS 3')
}

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')