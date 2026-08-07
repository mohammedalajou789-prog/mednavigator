
import { readFileSync, writeFileSync } from 'fs'

const FILE = 'src/components/student/MNRenderer.tsx'
const lines = readFileSync(FILE, 'utf8').split('\n')
console.log('Lines read:', lines.length)

// ── FIX 1: remove duplicate color: string in FigureRightItem ─────────────────
const rightItemIdx = lines.findIndex(l => l.trim() === 'interface FigureRightItem {')
console.log('FigureRightItem at line:', rightItemIdx + 1)

// Line after { should be first color, line after that should also be color (duplicate)
if (lines[rightItemIdx + 1]?.trim() === 'color: string' && lines[rightItemIdx + 2]?.trim() === 'color: string') {
  lines.splice(rightItemIdx + 2, 1) // remove second duplicate
  console.log('Fix 1 done: removed duplicate color field. Lines now:', lines.length)
} else {
  console.log('Fix 1: unexpected content around FigureRightItem, showing context:')
  for (let i = rightItemIdx; i <= rightItemIdx + 5; i++) console.log(`  [${i}]: ${lines[i]}`)
  process.exit(1)
}

// ── FIX 2: un-merge the for line that has const m appended to it ─────────────
const mergedIdx = lines.findIndex(l =>
  l.includes('for (const ll of leftBlock') && l.includes('const m = ll.match')
)
console.log('Merged for+const line at:', mergedIdx + 1)

if (mergedIdx === -1) {
  console.error('ERROR: could not find merged line')
  process.exit(1)
}

// Replace merged line with just the for part (clean)
lines[mergedIdx] = "          for (const ll of leftBlock[1].split('\\n').map(l => l.trim()).filter(Boolean)) {"
console.log('Fix 2 done: split merged line. Lines now:', lines.length)

// Verify next line is const m (should be there from patch 1)
console.log('Line after for:', lines[mergedIdx + 1]?.trim().slice(0, 50))

writeFileSync(FILE, lines.join('\n'), 'utf8')
console.log('Done. Patch 2 applied successfully.')
