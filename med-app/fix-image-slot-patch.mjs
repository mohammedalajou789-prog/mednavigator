import { readFileSync, writeFileSync } from 'fs'

const FILE = 'src/components/student/MNRenderer.tsx'
const lines = readFileSync(FILE, 'utf8').split('\n')
console.log('Lines read:', lines.length)

// ── FIX 1: add missing `color` field to FigureRightItem ──────────────────────
const rightItemIdx = lines.findIndex(l => l.trim() === 'interface FigureRightItem {')
console.log('FigureRightItem at line:', rightItemIdx + 1)

if (rightItemIdx === -1) {
  console.error('ERROR: could not find FigureRightItem')
  process.exit(1)
}

// Insert `  color: string` right after the opening brace
lines.splice(rightItemIdx + 1, 0, '  color: string')
console.log('Fix 1 done. Lines now:', lines.length)

// ── FIX 2: add missing `const m = ll.match(...)` before `if (m) leftPanel` ──
const ifMIdx = lines.findIndex(l => l.includes('if (m) leftPanel.push'))
console.log('if (m) leftPanel at line:', ifMIdx + 1)

if (ifMIdx === -1) {
  console.error('ERROR: could not find if (m) leftPanel.push')
  process.exit(1)
}

lines.splice(ifMIdx, 0, "            const m = ll.match(/^\\[(\\d+)\\|(\\w+)\\]\\s*(.+?)\\s+--\\s+(.+)$/)")
console.log('Fix 2 done. Lines now:', lines.length)

writeFileSync(FILE, lines.join('\n'), 'utf8')
console.log('Done. Patch applied successfully.')
