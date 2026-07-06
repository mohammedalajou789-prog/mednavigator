import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/(auth)/login/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Line 109 (index 108) — replace the bare > with the JSX-safe pattern
// Current:  >
// Fix: move the > onto the same line as the closing }} of style prop

// Find the line with just ">" after the style closing
for (let i = 100; i < 120; i++) {
  const line = lines[i]
  if (line && line.trim() === '>') {
    console.log(`Found bare > at line index ${i}: "${line}"`)
    // Check previous line ends with }}
    const prev = lines[i - 1]
    if (prev && prev.trimEnd().endsWith('}}')) {
      // Merge the > onto the previous line
      lines[i - 1] = prev.trimEnd() + '>'
      lines.splice(i, 1)
      console.log(`Merged > onto line index ${i - 1}`)
      break
    }
  }
}

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')