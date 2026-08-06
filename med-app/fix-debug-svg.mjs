import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/ConceptMapBlock.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Add console.log right after "const { svg } = await mermaid.render(...)"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const { svg } = await mermaid.render(')) {
    lines.splice(i + 1, 0, `          console.log('MERMAID_SVG_RAW:', svg.slice(0, 500))`)
    console.log('Debug log inserted at line', i + 2)
    break
  }
}

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')