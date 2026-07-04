import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Confirm exact lines
for (let i = 217; i <= 232; i++) {
  console.log(i+1, JSON.stringify(lines[i]))
}

// FIX 1: Line 219 (index 218) — "Q{currentIndex + 1}" is missing closing </span>
// Add </span> after it
if (lines[218].includes('Q{currentIndex + 1}')) {
  lines[218] = `              Q{currentIndex + 1}</span>`
  console.log('FIX 1 applied')
} else console.log('MISS 1:', JSON.stringify(lines[218]))

// FIX 2: Find and remove the orphaned </div> after line 231
// Line 227 (index 226) is "        </div>" — the orphaned extra closing div
const i2 = lines.findIndex((l, idx) => idx >= 225 && idx <= 235 && l.trim() === '</div>')
if (i2 !== -1) {
  lines[i2] = ''
  console.log('FIX 2 applied at line', i2+1)
} else console.log('MISS 2')

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')