import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Confirm exact lines before touching
console.log('226:', JSON.stringify(lines[225]))
console.log('227:', JSON.stringify(lines[226]))
console.log('228:', JSON.stringify(lines[227]))

// FIX 1: Line 227 (index 226) — add bookmark button style + SVG
lines[226] = `              title="Mark important" style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isCurrentImportant ? '#2563EB' : '#94A3B8', transition: 'transform 0.15s' }}><svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`

// FIX 2: Line 228 (index 227) — remove emoji content
lines[227] = ''

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')