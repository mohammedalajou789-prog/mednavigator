import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Step 1: Change Login button to add Register button next to it
lines.forEach((line, i) => {
  if (line.includes('href="/login"') && line.includes("background: '#fff'")) {
    lines[i] = `          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', border: '1px solid #E8ECF2', background: '#fff', color: '#0F172A', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Login
          </Link>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Register
          </Link>`
    console.log(`added Register button at line ${i + 1}`)
  }
})

// Step 2: Remove the 2400+ students block (the entire outer div with gap:22px)
let removing = false
let depth = 0
const result = []

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (!removing && line.includes("gap: '22px'") && line.includes('flexWrap')) {
    removing = true
    depth = 0
    console.log(`removing students block starting at line ${i + 1}`)
  }
  if (removing) {
    for (const ch of line) {
      if (ch === '<') depth++
      if (ch === '>') depth--
    }
    if (line.includes('</div>') && depth <= 0) {
      removing = false
      console.log(`finished removing at line ${i + 1}`)
    }
    continue
  }
  result.push(line)
}

writeFileSync(path, result.join('\n'), 'utf8')
console.log('done')