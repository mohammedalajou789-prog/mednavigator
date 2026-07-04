import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Print exact lines 219-232 for confirmation
for (let i = 218; i <= 232; i++) {
  console.log(i+1, JSON.stringify(lines[i]))
}

// FIX 1: Line 221 (index 220) — remove extra </div> after inner left div
// Line 221 is the correct closing of left div — keep it
// Line 223 (index 222) — extra </div> — remove it
lines[222] = ''

// FIX 2: Line 227 (index 226) — empty line where button style was — 
// The button needs its style restored. Current state shows title and style were stripped.
// Line 225 (index 224) is <button>, line 226 (index 225) is onClick, line 227 (index 226) is empty
// We need to add the style+SVG on line 227
lines[226] = `              title="Mark important" style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isCurrentImportant ? '#2563EB' : '#94A3B8', transition: 'transform 0.15s' }}><svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`

// FIX 3: Line 228 (index 227) — remove emoji content line
lines[227] = ''

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')