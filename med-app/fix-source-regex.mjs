import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/MNRenderer.tsx'
let content = readFileSync(path, 'utf8')

content = content.replace(
  'const sourceMatch = line.match(/^[\\*(.+?)\\*]$/)',
  'const sourceMatch = line.match(/^\\[\\*(.+?)\\*\\]$/)'
)

writeFileSync(path, content, 'utf8')
console.log('done')

const final = readFileSync(path, 'utf8')
console.log('regex fixed:', final.includes('const sourceMatch = line.match(/^\\[\\*(.+?)\\*\\]$/)'))