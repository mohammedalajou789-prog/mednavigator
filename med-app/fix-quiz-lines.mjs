import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Print exact content of the 3 lines we need to fix
console.log('Line 220:', JSON.stringify(lines[219]))
console.log('Line 226:', JSON.stringify(lines[225]))

// FIX 1: Line 220 (index 219) — </div> closing left column too early
// Replace with question text div + closing left column div
lines[219] = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>{current.question}</div>\r\n          </div>`

// FIX 2: Line 226 (index 225) — emoji content line after SVG bookmark button  
// Replace emoji line with empty string
lines[225] = ``

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')