import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Find exact line numbers
let btnsStart = -1
let mobileStart = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mn-btns') && lines[i].includes("display: 'flex'")) btnsStart = i
  if (lines[i].includes('mn-mobile-features') && lines[i].includes("display: 'none'")) { mobileStart = i; break }
}

console.log(`btnsStart line: ${btnsStart + 1}`)
console.log(`mobileStart line: ${mobileStart + 1}`)

// Print what we're replacing
console.log('--- BLOCK TO REPLACE ---')
for (let i = btnsStart; i < mobileStart; i++) {
  console.log(`${i + 1}: ${lines[i]}`)
}
console.log('--- END BLOCK ---')

const newBlock = `        <div className="mn-btns" style={{ display: 'flex', gap: '13px', marginBottom: '26px' }}>
          <a href="#universities" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '15px 26px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px -8px rgba(37,99,235,.55)', textDecoration: 'none' }}>
            Explore universities
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
            </svg>
          </a>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', border: '1px solid #E8ECF2', background: '#fff', color: '#0F172A', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Login
          </Link>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Register
          </Link>
        </div>`

const result = [
  ...lines.slice(0, btnsStart),
  newBlock,
  ...lines.slice(mobileStart)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')