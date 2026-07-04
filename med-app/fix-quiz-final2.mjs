import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Helper: find line index containing a unique string
function findLine(str) {
  const idx = lines.findIndex(l => l.includes(str))
  if (idx === -1) console.log('NOT FOUND:', str)
  return idx
}

// ── CHANGE 1: Stats bar div → flex-end ──
const i1 = findLine(`display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap'`)
if (i1 !== -1) lines[i1] = `      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginBottom: '14px' }}>`

// ── CHANGE 2: Remove StatBadge lines (4 lines), replace first with correct span ──
const i2a = findLine(`<StatBadge label={\`\${questions.length} questions\`}`)
if (i2a !== -1) lines[i2a] = `        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(22,163,74)' }}>{correctCount} correct</span>`

const i2b = findLine(`<StatBadge label={\`\${answeredCount} answered\`}`)
if (i2b !== -1) lines[i2b] = ``

const i2c = findLine(`<StatBadge label={\`\${correctCount} correct\`}`)
if (i2c !== -1) lines[i2c] = ``

const i2d = findLine(`{answeredCount > 0 && <StatBadge`)
if (i2d !== -1) lines[i2d] = ``

// ── CHANGE 3: Remove marginLeft auto wrapper div ──
const i3 = findLine(`marginLeft: 'auto', display: 'flex', gap: '8px'`)
if (i3 !== -1) lines[i3] = ``

// ── CHANGE 4: Remove importantIds button (3 lines) ──
const i4a = findLine(`importantIds.size > 0 && (`)
if (i4a !== -1) { lines[i4a] = ``; lines[i4a+1] = ``; lines[i4a+2] = `` }

// ── CHANGE 5: Remove showImportantOnly line in button ──
const i5 = findLine(`setShowImportantOnly(p => !p)`)
if (i5 !== -1) { lines[i5] = ``; lines[i5+1] = `` }

// ── CHANGE 6: Remove closing )} of importantIds ──
// Find the )} that closes importantIds block — it's after the button close
const i6 = findLine(`âگ {showImportantOnly ? 'All' : 'Important'}`)
if (i6 !== -1) { lines[i6] = ``; lines[i6+1] = ``; lines[i6+2] = `` }

// ── CHANGE 7: Finish button → dark style ──
const i7 = findLine(`padding: '6px 16px', background: '#2563EB', color: '#fff', borderRadius: '8px'`)
if (i7 !== -1) lines[i7] = `            style={{ height: '32px', padding: '0 14px', borderRadius: '9px', border: 'none', background: 'rgb(15,23,42)', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>`

// ── CHANGE 8: Remove closing </div> of marginLeft auto wrapper ──
// The </div> right before </div> (closing stats bar) — find "        </div>" that is before "      </div>"
// Stats bar closes at line with "      </div>" after the Finish button block
// We need to remove the extra "        </div>" (8 spaces) inside the stats bar
const i8 = findLine(`        </div>\n      </div>`)
// This won't work as single line — find it differently
// The extra </div> is the marginLeft wrapper closing — at 8 spaces indent
// After removing marginLeft auto line (i3), the next </div> at 8 spaces is the wrapper close
// Find "</div>" at 8-space indent after i3
for (let j = (i3 !== -1 ? i3 : 155); j < (i3 !== -1 ? i3 : 155) + 15; j++) {
  if (lines[j] && lines[j].trimEnd() === '        </div>') {
    lines[j] = ``
    break
  }
}

// ── CHANGE 9: Add progress row before Question navigator ──
const i9 = findLine(`{/* Question navigator */}`)
if (i9 !== -1) {
  lines[i9] = `      {/* Progress row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(51,65,85)', whiteSpace: 'nowrap' }}>Question {currentIndex + 1} of {total}</span>
        <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: 'rgb(231,234,241)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: 'rgb(37,99,235)', transition: 'width 0.35s', width: \`\${Math.round((currentIndex / total) * 100)}%\` }} />
        </div>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(37,99,235)', whiteSpace: 'nowrap' }}>{answeredCount}/{total} answered</span>
      </div>

      {/* Question navigator */}`
}

// ── CHANGE 10: Navigator dot colors ──
const i10 = findLine(`let bg = '#F1F5F9'; let color = '#64748B'`)
if (i10 !== -1) lines[i10] = `          let bg = 'rgb(238,240,244)'; let color = 'rgb(100,116,139)'`

const i10b = findLine(`if (i === currentIndex) { bg = '#2563EB'; color = '#fff' }`)
if (i10b !== -1) lines[i10b] = `          if (i === currentIndex) { bg = 'rgb(238,240,244)'; color = 'rgb(100,116,139)' }`

const i10c = findLine(`else if (answered && correct) { bg = '#16A34A'; color = '#fff' }`)
if (i10c !== -1) lines[i10c] = `          else if (answered && correct) { bg = 'rgb(220,243,231)'; color = 'rgb(19,138,90)' }`

const i10d = findLine(`else if (answered && !correct) { bg = '#DC2626'; color = '#fff' }`)
if (i10d !== -1) lines[i10d] = `          else if (answered && !correct) { bg = 'rgb(251,220,218)'; color = 'rgb(220,72,66)' }`

// ── CHANGE 11: Navigator dot borderRadius 8px→9px, fontSize 11px→12.5px ──
const i11 = findLine(`borderRadius: '8px', border: i === currentIndex ? '2px solid #2563EB' : '1px solid transparent'`)
if (i11 !== -1) lines[i11] = `              style={{ width: '32px', height: '32px', borderRadius: '9px', border: i === currentIndex ? '2px solid #2563EB' : 'transparent', background: bg, color, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', position: 'relative', transition: 'all 0.15s' }}>`

// ── CHANGE 12: Navigator marginBottom 20px→22px ──
const i12 = findLine(`display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px'`)
if (i12 !== -1) lines[i12] = `      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}>`

// ── CHANGE 13: Question card header gap/marginBottom ──
const i13 = findLine(`gap: '12px', marginBottom: '16px'`)
if (i13 !== -1) lines[i13] = `        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '22px' }}>`

// ── CHANGE 14: Replace inner header div ──
const i14 = findLine(`display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'`)
if (i14 !== -1) lines[i14] = `          <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', minWidth: 0 }}>`

// ── CHANGE 15: Replace Question pill span ──
const i15 = findLine(`fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px'`)
if (i15 !== -1) lines[i15] = `            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '30px', height: '30px', padding: '0 9px', borderRadius: '9px', background: 'rgb(238,243,255)', color: 'rgb(37,99,235)', fontSize: '12.5px', fontWeight: 800, marginTop: '1px' }}>`

// ── CHANGE 16: Replace Question X/Y text with Q{N} ──
const i16 = findLine(`Question {currentIndex + 1}/{total}`)
if (i16 !== -1) lines[i16] = `              Q{currentIndex + 1}`

// ── CHANGE 17: Remove showImportantOnly span ──
const i17 = findLine(`{showImportantOnly && <span style={{ fontSize: '11px', color: '#D97706' }}`)
if (i17 !== -1) lines[i17] = ``

// ── CHANGE 18: Add question text div after span closes (after </span> closing the Q badge) ──
// Replace bookmark button style line to include question text before it
const i18 = findLine(`style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px'`)
if (i18 !== -1) {
  // Insert question text div before the button — find the </div> that closes the left div (i14 div)
  // The structure after change: left div contains Q badge span + question text div
  // We need to insert question div after the closing </span> of Q badge
  // Find the line with closing </span> before the showImportantOnly line
  lines[i18] = `            title="Mark important" style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isCurrentImportant ? '#2563EB' : '#94A3B8', transition: 'transform 0.15s' }}>`
}

// ── CHANGE 19: Replace emoji content with bookmark SVG + close left div ──
const i19 = findLine(`{isCurrentImportant ? 'âگ' : 'âک†'}`)
if (i19 !== -1) lines[i19] = `              <svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`

// ── CHANGE 20: Replace <p> question text with div inside left column ──
const i20 = findLine(`fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '20px'`)
if (i20 !== -1) lines[i20] = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>`

// ── CHANGE 21: Replace </p> with </div></div> ──
// The </p> that closes current.question
const i21 = findLine(`          {current.question}`)
if (i21 !== -1) {
  // Next line should be "        </p>" — replace it
  if (lines[i21+1] && lines[i21+1].includes('</p>')) {
    lines[i21+1] = `            </div>\n          </div>`
  }
}

// ── CHANGE 22: Options gap 8→10 ──
const i22 = findLine(`display: 'flex', flexDirection: 'column', gap: '8px'`)
if (i22 !== -1) lines[i22] = `        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>`

// ── CHANGE 23: Option padding/radius ──
const i23 = findLine(`padding: '12px 16px', borderRadius: '12px', cursor: answered ? 'default' : 'pointer',`)
if (i23 !== -1) lines[i23] = `                  padding: '14px 16px', borderRadius: '13px', cursor: answered ? 'default' : 'pointer',`

// ── CHANGE 24: Option text style ──
const i24 = findLine(`textAlign: 'left', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',`)
if (i24 !== -1) lines[i24] = `                  textAlign: 'left', transition: 'background 0.15s, border-color 0.15s, transform 0.12s',`

// ── CHANGE 25: Letter badge 24→26px ──
const i25 = findLine(`width: '24px', height: '24px', borderRadius: '6px'`)
if (i25 !== -1) lines[i25] = `                <span style={{ width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, background: isCorrect && answered ? '#16A34A' : isSelected && !isCorrect && answered ? '#DC2626' : 'rgb(241,245,249)', color: (isCorrect && answered) || (isSelected && answered) ? '#fff' : 'rgb(100,116,139)' }}>`

// ── CHANGE 26: Label span add fontSize ──
const i26 = findLine(`<span style={{ flex: 1 }}>{label}</span>`)
if (i26 !== -1) lines[i26] = `                <span style={{ flex: 1, fontSize: '14.5px', lineHeight: 1.5 }}>{label}</span>`

// ── CHANGE 27: Checkmark → circle badge ──
const i27a = findLine(`{answered && isCorrect && <span style={{ color: '#16A34A', fontSize: '16px' }}>`)
if (i27a !== -1) lines[i27a] = `                {answered && isCorrect && <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: '#16A34A', color: '#fff' }}>\u2713</span>}`

const i27b = findLine(`{answered && isSelected && !isCorrect && <span style={{ color: '#DC2626', fontSize: '16px' }}>`)
if (i27b !== -1) lines[i27b] = `                {answered && isSelected && !isCorrect && <span style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: '#DC2626', color: '#fff' }}>\u2715</span>}`

// ── CHANGE 28: Nav Previous button ──
const i28 = findLine(`padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer', opacity: currentIndex === 0 ? 0.4 : 1`)
if (i28 !== -1) lines[i28] = `          style={{ flex: 1, height: '52px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 700, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: currentIndex === 0 ? 0.45 : 1, transition: 'transform 0.15s' }}>`

// ── CHANGE 29: Nav Next button ──
const i29 = findLine(`padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer', opacity: currentIndex === total - 1 ? 0.4 : 1`)
if (i29 !== -1) lines[i29] = `          style={{ flex: 2, height: '52px', borderRadius: '14px', border: 'none', background: '#2563EB', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: currentIndex === total - 1 ? 'not-allowed' : 'pointer', transition: 'transform 0.15s' }}>`

// ── CHANGE 30: Replace Next text + SVG ──
const i30 = findLine(`          Next`)
if (i30 !== -1) lines[i30] = `          Next question`

const i30b = findLine(`<polyline points="9 18 15 12 9 6"/>`)
if (i30b !== -1) lines[i30b] = ``
const i30c = lines.findIndex((l, idx) => idx > (i29 || 0) && l.includes('strokeLinejoin="round"><polyline'))
if (i30c !== -1 && i30c > (i29 || 0)) lines[i30c] = ``

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')