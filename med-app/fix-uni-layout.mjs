import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/(student)/[uniSlug]/page.tsx'
let content = readFileSync(path, 'utf8')

// Fix 1: Remove maxWidth constraint and centering margin
content = content.replace(
  "maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px'",
  "padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px'"
)

// Fix 2: auto-fill → auto-fit for subject cards grid
content = content.replace(
  "gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'",
  "gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'"
)

writeFileSync(path, content, 'utf8')
console.log('done')

// Verify
const lines = readFileSync(path, 'utf8').split('\n')
console.log('line 71:', lines[70].trim())
console.log('line 120:', lines[119].trim())