import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

let blockStart = -1
let blockEnd = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mn-mobile-features') && lines[i].includes("display: 'none'")) blockStart = i
  if (blockStart !== -1 && i > blockStart && lines[i].includes('</div>') && lines[i].trimStart().startsWith('</div>') && lines[i+1] && lines[i+1].includes('Mockup')) {
    blockEnd = i
    break
  }
}

console.log(`block: ${blockStart + 1} to ${blockEnd + 1}`)

const newBlock = `      {/* Mobile-only feature highlights */}
      <div className="mn-mobile-features" style={{ display: 'none', flexDirection: 'column' as const, gap: '12px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Lectures & Sheets</div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>Organized content for <span style={{ color: '#4F46E5', fontWeight: 600 }}>every subject</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FDF4FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 2H8a2 2 0 0 0-2 2v2h12V4a2 2 0 0 0-2-2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Flashcards & Quizzes</div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>Study smarter with <span style={{ color: '#9333EA', fontWeight: 600 }}>active recall</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Previous Years Bank</div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>Past papers sorted by <span style={{ color: '#EA580C', fontWeight: 600 }}>year and type</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ECFDF5', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Progress Tracking</div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>Track your learning with <span style={{ color: '#16A34A', fontWeight: 600 }}>star ratings</span></div>
          </div>
        </div>
      </div>`

const result = [
  ...lines.slice(0, blockStart),
  newBlock,
  ...lines.slice(blockEnd + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')