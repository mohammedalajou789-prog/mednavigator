import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
let content = readFileSync(path, 'utf8')
let count = 0

// CHANGE 1a: Stats bar div — flex-end aligned
const a1 = `display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}`
const b1 = `display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginBottom: '14px' }}`
if (content.includes(a1)) { content = content.replace(a1, b1); count++ } else console.log('MISS 1a')

// CHANGE 1b: Remove StatBadge lines — replace with correct count + dark Finish
const a1b = `        <StatBadge label={\`\${questions.length} questions\`} color="#EFF6FF" text="#2563EB" />`
const b1b = `        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(22,163,74)' }}>{correctCount} correct</span>`
if (content.includes(a1b)) { content = content.replace(a1b, b1b); count++ } else console.log('MISS 1b')

// CHANGE 1c: Remove answered badge
const a1c = `        <StatBadge label={\`\${answeredCount} answered\`} color="#F0FDF4" text="#16A34A" />`
if (content.includes(a1c)) { content = content.replace(a1c, ''); count++ } else console.log('MISS 1c')

// CHANGE 1d: Remove correct badge
const a1d = `        <StatBadge label={\`\${correctCount} correct\`} color="#F0FDF4" text="#16A34A" />`
if (content.includes(a1d)) { content = content.replace(a1d, ''); count++ } else console.log('MISS 1d')

// CHANGE 1e: Remove score badge
const a1e = `        {answeredCount > 0 && <StatBadge label={\`\${score}% score\`} color="#EFF6FF" text="#2563EB" />}`
if (content.includes(a1e)) { content = content.replace(a1e, ''); count++ } else console.log('MISS 1e')

// CHANGE 1f: Remove importantIds button wrapper div + important button, keep only Finish button restyled
const a1f = `        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>`
if (content.includes(a1f)) { content = content.replace(a1f, ''); count++ } else console.log('MISS 1f')

// CHANGE 1g: Finish button — dark background
const a1g = `style={{ padding: '6px 16px', background: '#2563EB', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}`
const b1g = `style={{ height: '32px', padding: '0 14px', borderRadius: '9px', border: 'none', background: 'rgb(15,23,42)', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}`
if (content.includes(a1g)) { content = content.replace(a1g, b1g); count++ } else console.log('MISS 1g')

// CHANGE 1h: Remove closing div of marginLeft auto wrapper
const a1h = `        </div>
      </div>`
// This pattern appears twice - we need the one in the stats bar
// Use a unique surrounding context
const a1h_ctx = `        </div>
      </div>

      {/* Question navigator */}`
const b1h_ctx = `      </div>

      {/* Progress row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(51,65,85)', whiteSpace: 'nowrap' }}>Question {currentIndex + 1} of {total}</span>
        <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: 'rgb(231,234,241)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', background: 'rgb(37,99,235)', transition: 'width 0.35s', width: \`\${Math.round((currentIndex / total) * 100)}%\` }} />
        </div>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'rgb(37,99,235)', whiteSpace: 'nowrap' }}>{answeredCount}/{total} answered</span>
      </div>

      {/* Question navigator */}`
if (content.includes(a1h_ctx)) { content = content.replace(a1h_ctx, b1h_ctx); count++ } else console.log('MISS 1h')

// CHANGE 2: Navigator dots marginBottom
const a2 = `display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}`
const b2 = `display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}`
if (content.includes(a2)) { content = content.replace(a2, b2); count++ } else console.log('MISS 2')

// CHANGE 3: Navigator dot colors
const a3 = `let bg = '#F1F5F9'; let color = '#64748B'`
const b3 = `let bg = 'rgb(238,240,244)'; let color = 'rgb(100,116,139)'`
if (content.includes(a3)) { content = content.replace(a3, b3); count++ } else console.log('MISS 3')

const a3b = `if (i === currentIndex) { bg = '#2563EB'; color = '#fff' }`
const b3b = `if (i === currentIndex) { bg = 'rgb(238,240,244)'; color = 'rgb(100,116,139)' }`
if (content.includes(a3b)) { content = content.replace(a3b, b3b); count++ } else console.log('MISS 3b')

const a3c = `else if (answered && correct) { bg = '#16A34A'; color = '#fff' }`
const b3c = `else if (answered && correct) { bg = 'rgb(220,243,231)'; color = 'rgb(19,138,90)' }`
if (content.includes(a3c)) { content = content.replace(a3c, b3c); count++ } else console.log('MISS 3c')

const a3d = `else if (answered && !correct) { bg = '#DC2626'; color = '#fff' }`
const b3d = `else if (answered && !correct) { bg = 'rgb(251,220,218)'; color = 'rgb(220,72,66)' }`
if (content.includes(a3d)) { content = content.replace(a3d, b3d); count++ } else console.log('MISS 3d')

// CHANGE 4: Question card header — replace pill with Q{N} badge
const a4 = `gap: '12px', marginBottom: '16px' }}`
const b4 = `gap: '14px', marginBottom: '22px' }}`
if (content.includes(a4)) { content = content.replace(a4, b4); count++ } else console.log('MISS 4')

// CHANGE 4b: Replace inner div with Q badge structure
const a4b = `          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>`
const b4b = `          <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', minWidth: 0 }}>`
if (content.includes(a4b)) { content = content.replace(a4b, b4b); count++ } else console.log('MISS 4b')

// CHANGE 4c: Replace Question pill span
const a4c = `            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px' }}>`
const b4c = `            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '30px', height: '30px', padding: '0 9px', borderRadius: '9px', background: 'rgb(238,243,255)', color: 'rgb(37,99,235)', fontSize: '12.5px', fontWeight: 800, marginTop: '1px' }}>`
if (content.includes(a4c)) { content = content.replace(a4c, b4c); count++ } else console.log('MISS 4c')

// CHANGE 4d: Replace Question X/Y text with Q{N}
const a4d = `              Question {currentIndex + 1}/{total}`
const b4d = `              Q{currentIndex + 1}`
if (content.includes(a4d)) { content = content.replace(a4d, b4d); count++ } else console.log('MISS 4d')

// CHANGE 4e: Replace question text <p> with question inside div (after closing span + showImportantOnly)
const a4e = `        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '20px', lineHeight: 1.6 }}>`
const b4e = `            <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'rgb(15,23,42)', lineHeight: 1.5 }}>`
if (content.includes(a4e)) { content = content.replace(a4e, b4e); count++ } else console.log('MISS 4e')

// CHANGE 4f: Close question text — </p> → </div>
const a4f = `          {current.question}
        </p>`
const b4f = `          {current.question}
            </div>
          </div>`
if (content.includes(a4f)) { content = content.replace(a4f, b4f); count++ } else console.log('MISS 4f')

// CHANGE 4g: Bookmark button — replace emoji with SVG
const a4g = `style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', flexShrink: 0, lineHeight: 1, transition: 'transform 0.15s' }}>`
const b4g = `title="Mark important" style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isCurrentImportant ? '#2563EB' : '#94A3B8', transition: 'transform 0.15s' }}><svg width="14" height="14" viewBox="0 0 24 24" fill={isCurrentImportant ? '#2563EB' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
if (content.includes(a4g)) { content = content.replace(a4g, b4g); count++ } else console.log('MISS 4g')

// CHANGE 4h: Remove emoji content line
const a4h = `              {isCurrentImportant ? 'âگ' : 'âک†'}`
if (content.includes(a4h)) { content = content.replace(a4h, ''); count++ } else console.log('MISS 4h')

// CHANGE 5: Option padding + borderRadius
const a5 = `padding: '12px 16px', borderRadius: '12px', cursor: answered ? 'default' : 'pointer',`
const b5 = `padding: '14px 16px', borderRadius: '13px', cursor: answered ? 'default' : 'pointer',`
if (content.includes(a5)) { content = content.replace(a5, b5); count++ } else console.log('MISS 5')

// CHANGE 5b: Option text style
const a5b = `textAlign: 'left', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',`
const b5b = `textAlign: 'left', transition: 'background 0.15s, border-color 0.15s, transform 0.12s',`
if (content.includes(a5b)) { content = content.replace(a5b, b5b); count++ } else console.log('MISS 5b')

// CHANGE 5c: Letter badge 24px→26px, borderRadius 6px→8px
const a5c = `width: '24px', height: '24px', borderRadius: '6px', background: isCorrect && answered ? '#16A34A' : isSelected && !isCorrect && answered ? '#DC2626' : '#F1F5F9', color: (isCorrect && answered) || (isSelected && answered) ? '#fff' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0`
const b5c = `width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, background: isCorrect && answered ? '#16A34A' : isSelected && !isCorrect && answered ? '#DC2626' : 'rgb(241,245,249)', color: (isCorrect && answered) || (isSelected && answered) ? '#fff' : 'rgb(100,116,139)'`
if (content.includes(a5c)) { content = content.replace(a5c, b5c); count++ } else console.log('MISS 5c')

// CHANGE 5d: Label span — add fontSize
const a5d = `                <span style={{ flex: 1 }}>{label}</span>`
const b5d = `                <span style={{ flex: 1, fontSize: '14.5px', lineHeight: 1.5 }}>{label}</span>`
if (content.includes(a5d)) { content = content.replace(a5d, b5d); count++ } else console.log('MISS 5d')

// CHANGE 6: Nav Previous button
const a6 = `style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer', opacity: currentIndex === 0 ? 0.4 : 1 }}`
const b6 = `style={{ flex: 1, height: '52px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 700, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: currentIndex === 0 ? 0.45 : 1, transition: 'transform 0.15s' }}`
if (content.includes(a6)) { content = content.replace(a6, b6); count++ } else console.log('MISS 6')

// CHANGE 7: Nav Next button
const a7 = `style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer', opacity: currentIndex === total - 1 ? 0.4 : 1 }}`
const b7 = `style={{ flex: 2, height: '52px', borderRadius: '14px', border: 'none', background: '#2563EB', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: currentIndex === total - 1 ? 'not-allowed' : 'pointer', transition: 'transform 0.15s' }}`
if (content.includes(a7)) { content = content.replace(a7, b7); count++ } else console.log('MISS 7')

// CHANGE 7b: Remove Next text + svg, replace with "Next question"
const a7b = `          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`
const b7b = `          Next question`
if (content.includes(a7b)) { content = content.replace(a7b, b7b); count++ } else console.log('MISS 7b')

writeFileSync(path, content, 'utf8')
console.log(`done — ${count}/24 fixes applied`)