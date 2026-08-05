import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

lines.forEach((line, i) => {
  // Fix 1: change mn-btns to wrap instead of column
  if (line.includes('.mn-btns {') && line.includes('flex-direction:column')) {
    lines[i] = line.replace(
      '.mn-btns { flex-direction:column !important; gap:10px !important; }',
      '.mn-btns { flex-wrap:wrap !important; gap:10px !important; }'
    )
    console.log(`fixed mn-btns flex at line ${i + 1}`)
  }
  // Fix 2: Explore universities stays full width, Login and Register are auto
  if (line.includes('.mn-btns a, .mn-btns > *')) {
    lines[i] = line.replace(
      '.mn-btns a, .mn-btns > * { width:100% !important; justify-content:center !important; padding:13px 20px !important; font-size:14px !important; }',
      '.mn-btns a { width:100% !important; justify-content:center !important; padding:13px 20px !important; font-size:14px !important; } .mn-btns > a ~ * { width:auto !important; flex:1 !important; justify-content:center !important; padding:13px 20px !important; font-size:14px !important; }'
    )
    console.log(`fixed mn-btns children at line ${i + 1}`)
  }
})

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')