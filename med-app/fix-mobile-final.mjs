import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

let btnsCloseLine = -1      // closing </div> of mn-btns
let studentsStart = -1      // div with gap:22px (students block)
let studentsEnd = -1        // closing </div> of students block
let mobileStart = -1        // mn-mobile-features div
let mobileEnd = -1          // closing </div> of mn-mobile-features

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mn-btns') && lines[i].includes("display: 'flex'")) {
    for (let j = i + 1; j < i + 15; j++) {
      if (lines[j].includes('</div>') && !lines[j].includes('<div')) {
        btnsCloseLine = j
        break
      }
    }
  }
  if (lines[i].includes("gap: '22px'") && lines[i].includes('flexWrap')) studentsStart = i
  if (studentsStart !== -1 && studentsEnd === -1 && i > studentsStart + 10 && lines[i].trimEnd() === '      </div>') studentsEnd = i
  if (lines[i].includes('mn-mobile-features') && lines[i].includes("display: 'none'")) mobileStart = i
  if (mobileStart !== -1 && mobileEnd === -1 && i > mobileStart + 5 && lines[i].trimEnd() === '      </div>') mobileEnd = i
}

console.log(`btnsCloseLine: ${btnsCloseLine + 1}`)
console.log(`studentsStart: ${studentsStart + 1}`)
console.log(`studentsEnd: ${studentsEnd + 1}`)
console.log(`mobileStart: ${mobileStart + 1}`)
console.log(`mobileEnd: ${mobileEnd + 1}`)

const registerBtn = `          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Register
          </Link>`

const newMobileFeatures = `      {/* Mobile-only feature highlights */}
      <div className="mn-mobile-features" style={{ display: 'none', flexDirection: 'column' as const, gap: '12px', marginTop: '24px', width: '100%' }}>
        {([
          { title: 'Lectures & Sheets', desc: 'Organized content for', descBold: 'every subject', bg: '#EEF2FF', color: '#4F46E5', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>) },
          { title: 'Flashcards & Quizzes', desc: 'Study smarter with', descBold: 'active recall', bg: '#FDF4FF', color: '#9333EA', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 2H8a2 2 0 0 0-2 2v2h12V4a2 2 0 0 0-2-2z"/></svg>) },
          { title: 'Previous Years Bank', desc: 'Past papers sorted by', descBold: 'year and type', bg: '#FFF7ED', color: '#EA580C', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>) },
          { title: 'Progress Tracking', desc: 'Track your learning with', descBold: 'star ratings', bg: '#ECFDF5', color: '#16A34A', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>) },
        ] as { title: string; desc: string; descBold: string; bg: string; color: string; icon: React.ReactNode }[]).map((f) => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{f.title}</div>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>{f.desc} <span style={{ color: f.color, fontWeight: 600 }}>{f.descBold}</span></div>
            </div>
          </div>
        ))}
      </div>`

const result = [
  ...lines.slice(0, btnsCloseLine + 1),
  registerBtn,
  ...lines.slice(btnsCloseLine + 1, studentsStart),
  ...lines.slice(studentsEnd + 1, mobileStart),
  newMobileFeatures,
  ...lines.slice(mobileEnd + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')