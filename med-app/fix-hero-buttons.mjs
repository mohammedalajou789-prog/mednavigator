import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Find line numbers
let btnsEnd = -1
let studentsBlockStart = -1
let studentsBlockEnd = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('href="/login"') && lines[i].includes("background: '#fff'")) btnsEnd = i + 2
  if (lines[i].includes("gap: '22px'") && lines[i].includes('flexWrap')) studentsBlockStart = i
  if (studentsBlockStart !== -1 && i > studentsBlockStart && lines[i].trimEnd() === '      </div>') {
    studentsBlockEnd = i
    break
  }
}

console.log(`btnsEnd: ${btnsEnd + 1}`)
console.log(`studentsBlockStart: ${studentsBlockStart + 1}`)
console.log(`studentsBlockEnd: ${studentsBlockEnd + 1}`)

// Insert Register button after Login closing tag (btnsEnd)
const registerBtn = `          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Register
          </Link>`

const result = [
  ...lines.slice(0, btnsEnd + 1),
  registerBtn,
  ...lines.slice(btnsEnd + 1, studentsBlockStart),
  ...lines.slice(studentsBlockEnd + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')