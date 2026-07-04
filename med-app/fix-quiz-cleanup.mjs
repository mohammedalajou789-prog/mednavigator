import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
let content = readFileSync(path, 'utf8')
let count = 0

// FIX 1: Remove leftover importantIds button block + broken </div> in stats bar
// Replace the entire broken stats bar section with clean version
const a1 = `        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(22,163,74)' }}>{correctCount} correct</span>
          {importantIds.size > 0 && (
            <button
              onClick={() => { setShowImportantOnly(p => !p); setCurrentIndex(0) }}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: showImportantOnly ? '#F59E0B' : '#FFFBEB', color: showImportantOnly ? '#fff' : '#D97706' }}>
              âگ {showImportantOnly ? 'All' : 'Important'}
            </button>
          <button
            onClick={() => setFinished(true)}
            style={{ height: '32px', padding: '0 14px', borderRadius: '9px', border: 'none', background: 'rgb(15,23,42)', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
            Finish
          </button>
        </div>
      </div>`
const b1 = `        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(22,163,74)' }}>{correctCount} correct</span>
        <button onClick={() => setFinished(true)} style={{ height: '32px', padding: '0 14px', borderRadius: '9px', border: 'none', background: 'rgb(15,23,42)', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Finish</button>
      </div>`
if (content.includes(a1)) { content = content.replace(a1, b1); count++ } else console.log('MISS 1')

// FIX 2: Add progress row — insert between stats bar and question navigator
const a2 = `      {/* Question navigator */}`
const b2 = `      {/* Progress row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(51,65,85)', whiteSpace: 'nowrap' }}>Question {currentIndex + 1} of {total}</span>
        <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: 'rgb(231,234,241)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: 'rgb(37,99,235)', transition: 'width 0.35s', width: \`\${Math.round((currentIndex / total) * 100)}%\` }} />
        </div>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(37,99,235)', whiteSpace: 'nowrap' }}>{answeredCount}/{total} answered</span>
      </div>

      {/* Question navigator */}`
if (content.includes(a2)) { content = content.replace(a2, b2); count++ } else console.log('MISS 2')

// FIX 3: Fix broken question text — replace <div> + </p> with correct structure
const a3 = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>
          {current.question}
        </p>`
const b3 = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>{current.question}</div>`
if (content.includes(a3)) { content = content.replace(a3, b3); count++ } else console.log('MISS 3')

// FIX 4: Remove leftover emoji line after bookmark SVG button
const a4 = `              {isCurrentImportant ? 'âگ' : 'âک†'}`
if (content.includes(a4)) { content = content.replace(a4, ''); count++ } else console.log('MISS 4')

// FIX 5: Replace "Next" + old SVG with "Next question"
const a5 = `          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`
const b5 = `          Next question`
if (content.includes(a5)) { content = content.replace(a5, b5); count++ } else console.log('MISS 5')

writeFileSync(path, content, 'utf8')
console.log(`done — ${count}/5 fixes applied`)