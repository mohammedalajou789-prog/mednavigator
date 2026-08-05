import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

lines.forEach((line, i) => {
  if (line.includes('mn-mobile-features') && line.includes("display: 'none'")) {
    lines[i] = line.replace(
      "gap: '12px', marginTop: '24px'",
      "gap: '12px', marginTop: '24px', width: '100%'"
    )
    console.log(`fixed line ${i + 1}`)
  }
  // Remove duplicate comment
  if (line.includes('Mobile-only feature highlights') && i > 120) {
    const prev = lines[i - 1]
    if (prev && prev.includes('Mobile-only feature highlights')) {
      lines[i] = ''
      console.log(`removed duplicate comment at line ${i + 1}`)
    }
  }
})

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')