'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StudentModal from '@/components/student/StudentModal'
import LectureStarsClient from '@/components/student/LectureStarsClient'

export interface SubjectLectureItem {
  id: string
  title: string
  slug: string | null
  flashCount: number
  quizCount: number
  pyqCount: number
  hasSheet: boolean
}

export interface SubjectGroupItem {
  id: string
  title: string
  lectures: SubjectLectureItem[]
}

interface SubjectChaptersClientProps {
  uniSlug: string
  subjectSlug: string
  /** 'Chapter' for standard/clinical subjects, 'Sub-Subject' for system subjects (Spec §3.7) */
  groupLabel: string
  groups: SubjectGroupItem[]
  initialStarsByLecture: Record<string, number>
  lastLectureId: string | null
  userId: string | null
}

// Inline preview rows (same colors as the previous subject page)
const ROW_STATUS: Record<number, { bg: string; color: string; label: string }> = {
  0: { bg:'#F1F5F9', color:'#94A3B8', label:'Not started' },
  1: { bg:'#FEF2F2', color:'#EF4444', label:'Need review' },
  2: { bg:'#FFFBEB', color:'#F59E0B', label:'Almost there' },
  3: { bg:'#E7F7EF', color:'#138A5A', label:'Mastered' },
}

// Popup lecture cards (same colors as the previous chapter page)
const CARD_STATUS: Record<number, { label: string; bg: string; color: string; iconBg: string; iconColor: string }> = {
  0: { label:'Not started', bg:'#F1F3F9',             color:'#8892A8', iconBg:'#EEF1F8', iconColor:'#9AA4BC' },
  1: { label:'Need review', bg:'rgba(239,68,68,.10)', color:'#DC2626', iconBg:'#FEF2F2', iconColor:'#EF4444' },
  2: { label:'Almost',      bg:'rgba(216,154,6,.12)', color:'#A1730A', iconBg:'#FFF6E0', iconColor:'#C99400' },
  3: { label:'Mastered',    bg:'rgba(19,138,90,.11)', color:'#138A5A', iconBg:'#E7F7EF', iconColor:'#17A66B' },
}

const PREVIEW_COUNT = 3

export default function SubjectChaptersClient({
  uniSlug,
  subjectSlug,
  groupLabel,
  groups,
  initialStarsByLecture,
  lastLectureId,
  userId,
}: SubjectChaptersClientProps) {
  const [starsByLecture, setStarsByLecture] = useState<Record<string, number>>(initialStarsByLecture)
  const [expanded, setExpanded]             = useState<Record<string, boolean>>({})
  const [openGroupId, setOpenGroupId]       = useState<string | null>(null)

  // Same event the old chapter page listened to — keeps cards in sync when stars change in the popup
  useEffect(() => {
    function handleStarChanged(e: Event) {
      const { lectureId, stars } = (e as CustomEvent).detail as { lectureId: string; stars: number }
      setStarsByLecture(prev => ({ ...prev, [lectureId]: stars }))
    }
    window.addEventListener('star-changed', handleStarChanged)
    return () => window.removeEventListener('star-changed', handleStarChanged)
  }, [])

  const isGuest   = !userId
  const labelLow  = groupLabel.toLowerCase()
  const openGroup = groups.find(g => g.id === openGroupId) ?? null

  function toggle(groupId: string) {
    setExpanded(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  function groupStats(group: SubjectGroupItem) {
    const total   = group.lectures.length
    const stars   = group.lectures.reduce((s, l) => s + (starsByLecture[l.id] ?? 0), 0)
    const flash   = group.lectures.reduce((s, l) => s + l.flashCount, 0)
    const quiz    = group.lectures.reduce((s, l) => s + l.quizCount, 0)
    const pyq     = group.lectures.reduce((s, l) => s + l.pyqCount, 0)
    const pct     = total > 0 ? Math.round((stars / (total * 3)) * 100) : 0
    const mastered = group.lectures.filter(l => (starsByLecture[l.id] ?? 0) === 3).length
    return { total, flash, quiz, pyq, pct, mastered }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes chxIn   { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes chxBar  { from{transform:scaleX(0)}to{transform:scaleX(1)} }
        @keyframes chxShim { 0%{background-position:-160% 0}55%,100%{background-position:260% 0} }
        @keyframes starPop { 0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)} }

        .chx-bar-blue {
          background:linear-gradient(100deg,#3B79FF 0%,#3B79FF 38%,#A9C4FF 50%,#2456D6 62%,#2456D6 100%);
          background-size:260% 100%; transform-origin:left;
          animation:chxBar 1s cubic-bezier(.4,0,.2,1) .5s backwards, chxShim 3.6s ease-in-out 1.6s infinite;
        }
        .chx-bar-green {
          background:linear-gradient(100deg,#17A66B 0%,#17A66B 38%,#7EE2B3 50%,#108051 62%,#108051 100%);
          background-size:260% 100%; transform-origin:left;
          animation:chxBar 1s cubic-bezier(.4,0,.2,1) .5s backwards, chxShim 3.6s ease-in-out 1.8s infinite;
        }

        .ch-card { transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease; }
        .ch-card:hover { transform:translateY(-3px); border-color:#C2D4FF !important; box-shadow:0 22px 40px -26px rgba(40,90,200,.9) !important; }
        .ch-open:focus-visible, .ch-chev:focus-visible, .ch-all:focus-visible { outline:2px solid #2F6BFF; outline-offset:-2px; border-radius:14px; }
        .ch-chev { transition:background .2s ease; }
        .ch-chev:hover { background:#F1F5FD !important; }
        .lec-row { transition:background .2s ease,transform .2s ease; }
        .lec-row:hover { background:#EBF1FB !important; transform:translateX(3px); }

        .lec-card { transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .lec-card:hover { transform:translateY(-2px); border-color:#C2D4FF !important; box-shadow:0 20px 36px -26px rgba(40,90,200,.95) !important; }
        .star-btn { background:none; border:none; padding:3px; cursor:pointer; display:flex; line-height:0; transition:transform .18s ease; }
        .star-btn:hover { transform:scale(1.18); }
        .view-link { transition:transform .2s ease; }
        .view-link:hover { transform:translateX(4px); }
        .lec-status { display:none; }
        @media (min-width:640px) { .lec-status { display:inline-flex; } }

        @media (prefers-reduced-motion: reduce) {
          .ch-card, .lec-row, .lec-card, .view-link { transition:none; }
          .ch-card:hover, .lec-row:hover, .lec-card:hover, .view-link:hover { transform:none; }
          .chx-bar-blue, .chx-bar-green { animation:none; }
        }
      `}</style>

      {/* ── Section header ── */}
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:14, flexWrap:'wrap', animation:'fadeUp .5s ease .34s backwards' }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:'-.02em', color:'#15203A' }}>{groupLabel}s</h2>
        <span style={{ fontSize:13, fontWeight:700, color:'#2F6BFF' }}>{groups.length} {labelLow}{groups.length !== 1 ? 's' : ''}</span>
        <span style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color:'#8892A8' }}>Tap a {labelLow} to see all its lectures</span>
      </div>

      {groups.length === 0 ? (
        <div style={{ padding:48, textAlign:'center', color:'#8892A8', fontSize:14, background:'#fff', borderRadius:18, border:'1px solid #E7ECF6' }}>
          No {labelLow}s with lectures yet.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {groups.map((group, gi) => {
            const { total, flash, quiz, pyq, pct } = groupStats(group)
            const isOpen   = !!expanded[group.id]
            const isDone   = pct === 100
            const inProg   = pct > 0 && pct < 100
            const badgeBg  = isDone ? '#E7F7EF' : inProg ? '#FFF6E0' : '#EEF1F8'
            const badgeBdr = isDone ? '#C7EBD8' : inProg ? '#F3E1AE' : '#DEE2EE'
            const badgeClr = isDone ? '#138A5A' : inProg ? '#A1730A' : '#8892A8'
            const badgeTxt = isDone ? 'Done'    : inProg ? `${pct}% · in progress` : 'Not started'
            const iconBg   = isDone ? '#E7F7EF' : inProg ? '#EEF3FF' : '#F1F4FA'
            const iconClr  = isDone ? '#138A5A' : inProg ? '#2F6BFF' : '#8892A8'
            const barCls   = isDone ? 'chx-bar-green' : inProg ? 'chx-bar-blue' : ''
            const preview  = group.lectures.slice(0, PREVIEW_COUNT)
            const panelId  = `ch-lectures-${group.id}`

            return (
              <div key={group.id} className="ch-card" style={{ borderRadius:18, border:'1px solid #E7ECF6', background:'#fff', boxShadow:'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.7) 0px 14px 34px -26px', overflow:'hidden', animation:'fadeUp .5s ease backwards', animationDelay:`${0.38 + gi * 0.06}s` }}>

                {/* Header row: [card body → opens popup] [chevron → expands inline] */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <button
                    type="button"
                    className="ch-open"
                    onClick={() => setOpenGroupId(group.id)}
                    aria-haspopup="dialog"
                    style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:16, padding:'20px 8px 20px 22px', background:'none', border:'none', textAlign:'left', cursor:'pointer', font:'inherit', color:'inherit' }}
                  >
                    <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:46, height:46, borderRadius:13, background:iconBg, color:iconClr, flexShrink:0 }}>
                      {isDone ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      )}
                    </span>
                    <span style={{ flex:1, minWidth:0, display:'block' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:16, fontWeight:700, color:'#15203A', letterSpacing:'-.01em' }}>{group.title}</span>
                        {!isGuest && <span style={{ padding:'2px 9px', borderRadius:999, background:badgeBg, border:`1px solid ${badgeBdr}`, color:badgeClr, fontSize:11, fontWeight:700 }}>{badgeTxt}</span>}
                      </span>
                      <span style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:6, fontSize:12.5, fontWeight:600, color:'#8892A8' }}>
                        <span>{total} lecture{total !== 1 ? 's' : ''}</span>
                        {flash > 0 && <span>{flash} flashcard{flash !== 1 ? 's' : ''}</span>}
                        {quiz  > 0 && <span>{quiz} Q</span>}
                        {pyq   > 0 && <span>{pyq} PYQ</span>}
                      </span>
                      {!isGuest && (
                        <span style={{ display:'block', marginTop:12, height:6, borderRadius:999, background:'#EAF0FB', overflow:'hidden' }}>
                          {barCls ? (
                            <span className={barCls} style={{ display:'block', height:'100%', width:`${Math.max(pct, 2)}%`, borderRadius:999 }}/>
                          ) : (
                            <span style={{ display:'block', height:'100%', width:'2%', borderRadius:999, background:'#C7D3EA' }}/>
                          )}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="ch-chev"
                    onClick={() => toggle(group.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={`${isOpen ? 'Hide' : 'Show'} lectures in ${group.title}`}
                    style={{ width:44, height:44, marginRight:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12, border:'none', background:'transparent', cursor:'pointer' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#2F6BFF' : '#94A3B8'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .25s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                {/* Inline lecture preview (chevron) */}
                {isOpen && (
                  <div id={panelId} style={{ padding:'0 22px 18px', animation:'chxIn .25s ease' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, borderTop:'1px solid #EEF2F8', paddingTop:14 }}>
                      {preview.map((lec, li) => {
                        const st       = ROW_STATUS[starsByLecture[lec.id] ?? 0]
                        const isResume = !isGuest && lec.id === lastLectureId
                        return (
                          <Link key={lec.id} prefetch={false} href={`/${uniSlug}/${subjectSlug}/${lec.slug ?? lec.id}`} style={{ textDecoration:'none' }}>
                            <div className="lec-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:11, background:isResume ? '#EEF3FF' : '#F5F8FD', border:isResume ? '1px solid #D8E4FF' : 'none' }}>
                              <span style={{ fontSize:11.5, fontWeight:800, color:isResume ? '#2F6BFF' : '#B4BECE', width:16, flexShrink:0 }}>{String(li + 1).padStart(2, '0')}</span>
                              <span style={{ flex:1, minWidth:0, fontSize:13.5, fontWeight:isResume ? 700 : 600, color:isResume ? '#15203A' : '#475569', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lec.title}</span>
                              {!isGuest && (
                                <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:7, background:isResume ? '#fff' : st.bg, color:isResume ? '#2563EB' : st.color, flexShrink:0 }}>
                                  {isResume ? 'Resume' : st.label}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                      {total > PREVIEW_COUNT && (
                        <button
                          type="button"
                          className="ch-all"
                          onClick={() => setOpenGroupId(group.id)}
                          aria-haspopup="dialog"
                          style={{ alignSelf:'flex-start', fontSize:12.5, fontWeight:800, letterSpacing:'.04em', color:'#2F6BFF', marginTop:6, padding:'6px 0', background:'none', border:'none', cursor:'pointer', font:'inherit' }}
                        >
                          VIEW ALL {total} LECTURES →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Chapter popup (replaces the old chapter page) ── */}
      <StudentModal
        open={openGroup !== null}
        onClose={() => setOpenGroupId(null)}
        label={openGroup ? `${groupLabel}: ${openGroup.title}` : groupLabel}
        maxWidth={760}
      >
        {openGroup && (() => {
          const { total, flash, quiz, pct, mastered } = groupStats(openGroup)
          const hint = mastered === total && total > 0
            ? `Every lecture in this ${labelLow} is mastered — nice work.`
            : `${mastered} of ${total} lectures mastered · ${total - mastered} still need a pass`

          return (
            <>
              {/* Header */}
              <div style={{ paddingRight:48 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontWeight:800, letterSpacing:'.09em', textTransform:'uppercase', color:'#2F6BFF', background:'rgba(47,107,255,.09)', padding:'5px 11px', borderRadius:99 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#2F6BFF' }}/>
                  <span>{groupLabel}</span>
                </div>
                <h2 style={{ margin:'10px 0 0', fontSize:'clamp(22px,4vw,28px)', lineHeight:1.12, fontWeight:800, letterSpacing:'-.03em', color:'#15203A' }}>
                  {openGroup.title}
                </h2>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:700, color:'#55617D', background:'#fff', border:'1px solid #E2EAFB', padding:'6px 12px', borderRadius:99 }}>
                    {total} lecture{total !== 1 ? 's' : ''}
                  </span>
                  {flash > 0 && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:700, color:'#55617D', background:'#fff', border:'1px solid #E2EAFB', padding:'6px 12px', borderRadius:99 }}>
                      {flash} flashcard{flash !== 1 ? 's' : ''}
                    </span>
                  )}
                  {quiz > 0 && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:700, color:'#55617D', background:'#fff', border:'1px solid #E2EAFB', padding:'6px 12px', borderRadius:99 }}>
                      {quiz} question{quiz !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress (logged in) */}
              {!isGuest && (
                <div style={{ marginTop:18 }}>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12.5, fontWeight:600, color:'#8892A8' }}>{hint}</span>
                    <span style={{ fontSize:16, fontWeight:800, color:'#2456D6' }}>{pct}%</span>
                  </div>
                  <div style={{ height:8, borderRadius:99, background:'rgba(225,233,250,.9)', overflow:'hidden' }}>
                    <div className="chx-bar-blue" style={{ height:'100%', width:`${pct}%`, borderRadius:99, transition:'width .5s ease' }}/>
                  </div>
                </div>
              )}

              {/* Guest banner */}
              {isGuest && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', background:'linear-gradient(120deg,rgba(37,99,235,0.06),rgba(124,58,237,0.04))', border:'1px solid rgba(37,99,235,0.15)', borderRadius:14, padding:'14px 18px', marginTop:18 }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'#15203A' }}>Track your progress</div>
                    <div style={{ fontSize:12, color:'#8892A8', marginTop:1 }}>Create a free account to rate lectures and track your progress</div>
                  </div>
                  <Link href="/register" prefetch={false} style={{ display:'inline-flex', alignItems:'center', height:38, padding:'0 16px', borderRadius:10, background:'#2563EB', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
                    Create Free Account
                  </Link>
                </div>
              )}

              {/* Lectures */}
              <div style={{ display:'flex', alignItems:'baseline', gap:10, margin:'22px 0 12px', flexWrap:'wrap' }}>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, letterSpacing:'-.02em', color:'#15203A' }}>Lectures</h3>
                {!isGuest && <span style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color:'#8892A8' }}>Tap the stars to rate your recall</span>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {openGroup.lectures.map((lecture, li) => {
                  const stars = starsByLecture[lecture.id] ?? 0
                  const st    = CARD_STATUS[stars]
                  const metaParts: string[] = []
                  if (lecture.hasSheet)       metaParts.push('Sheet')
                  if (lecture.flashCount > 0) metaParts.push(`${lecture.flashCount} cards`)
                  if (lecture.quizCount  > 0) metaParts.push(`${lecture.quizCount} Q`)
                  const meta = metaParts.join(' · ')

                  return (
                    <div key={lecture.id} className="lec-card" style={{ borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'14px 16px', boxShadow:'0 1px 2px rgba(16,24,40,.04)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:42, height:42, borderRadius:12, background:st.iconBg, color:st.iconColor, flexShrink:0, fontSize:13.5, fontWeight:800, letterSpacing:'-.02em', transition:'background .3s ease,color .3s ease' }}>
                          {String(li + 1).padStart(2, '0')}
                        </span>

                        <div style={{ flex:1, minWidth:'min(100%,180px)' }}>
                          <div style={{ fontSize:14.5, fontWeight:700, color:'#15203A', lineHeight:1.35 }}>{lecture.title}</div>
                          {meta && <div style={{ fontSize:12, fontWeight:600, color:'#9AA4BC', marginTop:3 }}>{meta}</div>}
                        </div>

                        {!isGuest && userId && (
                          <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                            <LectureStarsClient lectureId={lecture.id} initialStars={stars} userId={userId} />
                          </div>
                        )}

                        {!isGuest && (
                          <span className="lec-status" style={{ padding:'5px 11px', borderRadius:9, fontSize:11, fontWeight:700, flexShrink:0, background:st.bg, color:st.color, transition:'background .3s ease,color .3s ease' }}>
                            {st.label}
                          </span>
                        )}

                        <Link className="view-link" prefetch={false} href={`/${uniSlug}/${subjectSlug}/${lecture.slug ?? lecture.id}`} style={{ display:'inline-flex', alignItems:'center', gap:5, minHeight:44, fontSize:13, fontWeight:800, color:'#2F6BFF', flexShrink:0, textDecoration:'none' }}>
                          <span>View</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        })()}
      </StudentModal>
    </>
  )
}