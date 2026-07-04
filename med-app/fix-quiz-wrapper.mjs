import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// FIX 1: Fix broken boxShadow on line 199 (index 198)
lines[198] = `        boxShadow: 'rgba(255,255,255,0.6) 0px 1px 0px inset,rgba(16,24,40,0.04) 0px 1px 2px,rgba(16,24,40,0.12) 0px 10px 20px -12px,rgba(37,99,235,0.18) 0px 26px 46px -28px',`

// FIX 2: Add opening 640px wrapper before stats bar (line 154, index 153)
// Current line 154: "      {/* Stats bar */}"
lines[153] = `      <div style={{ width: '100%', maxWidth: '640px', marginTop: '6px' }}>\n` + lines[153]

// FIX 3: Close the 640px wrapper after navigation closing </div>
// Find the closing </div> of navigation by reading line 280 area
// Navigation closing div is at line 279 (index 278)
// After it, add </div> to close the 640px wrapper
lines[278] = lines[278] + `\n      </div>`

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')