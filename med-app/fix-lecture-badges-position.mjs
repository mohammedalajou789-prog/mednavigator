import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/LectureHub.tsx'
const src = readFileSync(path, 'utf8')

// OLD: badges ABOVE title wrapper, title wrapper has no badges inside
const OLD = `            {/* Desktop badges */}
            <div className="hidden sm:flex" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '9px', flexShrink: 0 }}>
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Completed
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  In Progress
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '12.5px', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1" strokeLinecap="round"strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>
            {/* Mobile badges */}
            <div className="flex sm:hidden gap-2 mb-3 flex-wrap">
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '11px', fontWeight: 700 }}>✓ Completed</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '11px', fontWeight: 700 }}>In Progress</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '11px', fontWeight: 700 }}>
                ⭐ {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '18px', justifyContent: 'space-between', flexWrap: 'wrap' }}>`

// NEW: mobile badges stay above, title wrapper contains icon+title on left AND desktop badges on right
const NEW = `            {/* Mobile badges */}
            <div className="flex sm:hidden gap-2 mb-3 flex-wrap">
              {isCompleted ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '11px', fontWeight: 700 }}>✓ Completed</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '11px', fontWeight: 700 }}>In Progress</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '11px', fontWeight: 700 }}>
                ⭐ {subject.access_mode === 'free' ? 'Free' : 'Premium'}
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '18px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {/* Desktop badges — inside flex row, pushed to the right */}
              <div className="hidden sm:flex" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '9px', flexShrink: 0, order: 2 }}>
                {isCompleted ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#E7F7EF', border: '1px solid #C7EBD8', color: '#138A5A', fontSize: '12.5px', fontWeight: 700 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Completed
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#EFF4FF', border: '1px solid #D5E2FF', color: '#2F6BFF', fontSize: '12.5px', fontWeight: 700 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    In Progress
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: '#FFF6E0', border: '1px solid #F3E1AE', color: '#A1730A', fontSize: '12.5px', fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1" strokeLinecap="round"strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {subject.access_mode === 'free' ? 'Free' : 'Premium'}
                </span>
              </div>`

if (!src.includes(OLD)) {
  console.error('❌ OLD block not found — paste the error to the Architect')
  process.exit(1)
}

const result = src.replace(OLD, NEW)
writeFileSync(path, result, 'utf8')
console.log('✅ done — desktop badges moved inside title wrapper with order:2')