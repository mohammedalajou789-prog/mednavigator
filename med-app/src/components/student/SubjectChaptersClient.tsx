'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import SubjectDialog from '@/components/student/SubjectDialog'
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

// Lecture status (0–3 stars)
const STATUS: Record<number, { label: string; bg: string; color: string }> = {
  0: { label:'Not started',  bg:'#F1F4FA', color:'#6B7690' },
  1: { label:'Need review',  bg:'#FEF2F2', color:'#DC2626' },
  2: { label:'Almost there', bg:'#FFF6E0', color:'#A1730A' },
  3: { label:'Mastered',     bg:'#E7F7EF', color:'#138A5A' },
}

const pad = (n: number) => String(n).padStart(2, '0')
const plural = (n: number, w: string) => `${n} ${w}${n !== 1 ? 's' : ''}`

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
  const [openGroupId, setOpenGroupId]       = useState<string | null>(null)

  // Keeps cards + popup in sync when stars change inside LectureStarsClient
  useEffect(() => {
    function handleStarChanged(e: Event) {
      const { lectureId, stars } = (e as CustomEvent).detail as { lectureId: string; stars: number }
      setStarsByLecture(prev => ({ ...prev, [lectureId]: stars }))
    }
    window.addEventListener('star-changed', handleStarChanged)
    return () => window.removeEventListener('star-changed', handleStarChanged)
  }, [])

  const isGuest    = !userId
  const labelLow   = groupLabel.toLowerCase()
  const openIndex  = groups.findIndex(g => g.id === openGroupId)
  const openGroup  = openIndex >= 0 ? groups[openIndex] : null

  function groupStats(group: SubjectGroupItem) {
    const total    = group.lectures.length
    const stars    = group.lectures.reduce((s, l) => s + (starsByLecture[l.id] ?? 0), 0)
    const flash    = group.lectures.reduce((s, l) => s + l.flashCount, 0)
    const quiz     = group.lectures.reduce((s, l) => s + l.quizCount, 0)
    const pyq      = group.lectures.reduce((s, l) => s + l.pyqCount, 0)
    const pct      = total > 0 ? Math.round((stars / (total * 3)) * 100) : 0
    const mastered = group.lectures.filter(l => (starsByLecture[l.id] ?? 0) === 3).length
    return { total, flash, quiz, pyq, pct, mastered }
  }

  return (
    <>
      <style>{`
        /* ── Section header ── */
        .ch-head { display:flex; align-items:baseline; gap:8px 10px; flex-wrap:wrap; margin-bottom:12px; animation:spFadeUp .5s ease .34s backwards; }
        .ch-head h2 { margin:0; font-size:18px; font-weight:800; letter-spacing:-.02em; color:#15203A; }
        .ch-count { font-size:13px; font-weight:700; color:#2F6BFF; }
        .ch-hint { margin-left:auto; font-size:12px; font-weight:600; color:#6B7690; }

        /* ── Grid: 1 col phone · 2 cols tablet · 3 cols desktop ── */
        .ch-grid { display:grid; grid-template-columns:minmax(0,1fr); gap:10px; }

        /* Card — phone: compact row [tile | title/meta/bar | chevron] */
        .ch-card { display:grid; grid-template-columns:44px minmax(0,1fr) 18px; grid-template-areas:"tile body chev" "tile bar chev";
          column-gap:12px; row-gap:8px; align-items:center; width:100%; box-sizing:border-box; padding:14px 12px 14px 14px;
          background:#fff; border:1px solid #E7ECF6; border-radius:18px; text-align:left; cursor:pointer; font:inherit; color:inherit;
          box-shadow:0 1px 2px rgba(16,24,40,.04),0 14px 34px -26px rgba(40,90,200,.7);
          transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease; animation:spFadeUp .5s ease backwards; }
        .ch-card:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }
        .ch-card:active { transform:scale(.99); }
        .ch-card.no-bar { grid-template-areas:"tile body chev"; }
        .ch-tile { grid-area:tile; width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:800; letter-spacing:-.02em; }
        .ch-pill { display:none; }
        .ch-body { grid-area:body; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .ch-title { font-size:15.5px; font-weight:700; line-height:1.3; letter-spacing:-.01em; color:#15203A; }
        .ch-meta { font-size:12.5px; font-weight:600; color:#6B7690; }
        .ch-bar { grid-area:bar; display:flex; align-items:center; gap:10px; }
        .ch-track { flex:1; height:6px; border-radius:999px; background:#EAF0FB; overflow:hidden; }
        .ch-fill { display:block; height:100%; border-radius:999px; }
        .ch-pct { font-size:12.5px; font-weight:800; color:#15203A; min-width:34px; text-align:right; }
        .ch-cta { display:none; }
        .ch-chev { grid-area:chev; color:#94A3B8; }

        @media (min-width:640px) {
          .ch-head { margin-bottom:14px; }
          .ch-head h2 { font-size:20px; }
          .ch-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
          /* Card — tablet/desktop: vertical title card */
          .ch-card, .ch-card.no-bar { grid-template-columns:minmax(0,1fr) auto; grid-template-rows:auto auto 1fr auto;
            grid-template-areas:"tile pill" "body body" "bar bar" "cta cta"; row-gap:14px; align-items:start;
            padding:18px; min-height:206px; border-radius:20px; }
          .ch-pill { grid-area:pill; display:inline-flex; align-self:center; padding:4px 10px; border-radius:999px; font-size:11.5px; font-weight:700; }
          .ch-body { gap:5px; }
          .ch-title { font-size:17px; line-height:1.25; }
          .ch-meta { font-size:13px; }
          .ch-bar { align-self:end; }
          .ch-cta { grid-area:cta; display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:800; color:#2F6BFF; }
          .ch-chev { display:none; }
        }
        @media (min-width:1100px) {
          .ch-head h2 { font-size:22px; }
          .ch-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
          .ch-card, .ch-card.no-bar { padding:20px; min-height:212px; }
          .ch-tile { width:46px; height:46px; font-size:15px; }
          .ch-title { font-size:18px; }
        }

        /* ── Popup header ── */
        .dlg-chip { display:inline-flex; align-items:center; gap:7px; padding:5px 11px; border-radius:99px; background:rgba(47,107,255,.09);
          color:#2F6BFF; font-size:10.5px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; }
        .dlg-chip i { width:5px; height:5px; border-radius:50%; background:#2F6BFF; }
        .dlg-title { margin:10px 0 0; padding-right:52px; font-size:clamp(21px,4vw,28px); line-height:1.12; font-weight:800; letter-spacing:-.03em; color:#15203A; }
        .dlg-stats { display:flex; flex-wrap:wrap; gap:6px 8px; margin-top:12px; }
        .dlg-stats span { padding:5px 11px; border-radius:99px; background:#fff; border:1px solid #E2EAFB; color:#55617D; font-size:12px; font-weight:700; }
        .dlg-progress { margin-top:14px; }
        .dlg-progress-row { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:8px; }
        .dlg-hint { font-size:12.5px; font-weight:600; color:#55617D; }
        .dlg-pct { font-size:16px; font-weight:800; color:#2456D6; }
        .dlg-track { height:8px; border-radius:99px; background:rgba(225,233,250,.9); overflow:hidden; }

        /* ── Popup body ── */
        .dlg-guest { display:flex; align-items:center; justify-content:space-between; gap:12px 16px; flex-wrap:wrap; margin:4px 0 14px;
          padding:14px 16px; border-radius:14px; border:1px solid rgba(37,99,235,.15);
          background:linear-gradient(120deg,rgba(37,99,235,.06),rgba(124,58,237,.04)); }
        .dlg-guest a { display:inline-flex; align-items:center; height:40px; padding:0 16px; border-radius:10px; background:#2563EB; color:#fff;
          font-size:13px; font-weight:700; text-decoration:none; flex-shrink:0; }
        .dlg-sub { display:flex; align-items:baseline; gap:10px; margin:2px 4px 10px; }
        .dlg-sub h3 { margin:0; font-size:15px; font-weight:800; letter-spacing:-.02em; color:#15203A; }
        .dlg-sub span { margin-left:auto; font-size:11.5px; font-weight:600; color:#6B7690; }
        .lec-list { display:flex; flex-direction:column; gap:8px; }

        .lec-row { display:flex; align-items:center; gap:6px; padding:6px 4px 6px 8px; border-radius:16px; border:1px solid #E7ECF6; background:#fff;
          transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease; }
        .lec-row.is-resume { background:#F3F7FF; border-color:#C9D9FF; }
        .lec-link { flex:1; min-width:0; min-height:50px; display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit; border-radius:12px; }
        .lec-link:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }
        .lec-num { width:36px; height:36px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
          font-size:12.5px; font-weight:800; transition:background .3s ease,color .3s ease; }
        .lec-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .lec-title { font-size:14px; font-weight:700; line-height:1.3; color:#15203A;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .lec-line { display:flex; align-items:center; gap:6px; min-width:0; }
        .lec-resume { flex-shrink:0; padding:1px 7px; border-radius:6px; background:#2563EB; color:#fff; font-size:10px; font-weight:800; letter-spacing:.06em; }
        .lec-status-txt { font-size:11.5px; font-weight:700; }
        .lec-meta { display:none; font-size:12px; font-weight:600; color:#6B7690; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .is-guest .lec-meta { display:block; }
        .lec-stars { display:flex; align-items:center; flex-shrink:0; }
        .lec-pill { display:none; }

        @media (min-width:640px) {
          .dlg-stats span { font-size:12.5px; padding:6px 12px; }
          .dlg-sub h3 { font-size:16px; }
          .dlg-sub span { font-size:12px; }
          .lec-row { gap:10px; padding:8px 10px 8px 8px; }
          .lec-link { gap:12px; min-height:48px; }
          .lec-num { width:42px; height:42px; border-radius:12px; font-size:13.5px; }
          .lec-title { font-size:14.5px; -webkit-line-clamp:1; }
          .lec-status-txt { display:none; }
          .lec-meta { display:block; }
          .lec-pill { display:inline-flex; justify-content:center; width:100px; flex-shrink:0; padding:5px 0; border-radius:9px;
            font-size:11.5px; font-weight:700; transition:background .3s ease,color .3s ease; }
        }

        @media (hover:hover) {
          .ch-card:hover { transform:translateY(-3px); border-color:#C2D4FF; box-shadow:0 22px 40px -26px rgba(40,90,200,.9); }
          .lec-row:hover { border-color:#C2D4FF; transform:translateX(2px); box-shadow:0 14px 26px -22px rgba(40,90,200,.9); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ch-card, .lec-row { transition:none; animation:none; }
          .ch-card:hover, .lec-row:hover { transform:none; }
        }
      `}</style>

      {/* ── Section header ── */}
      <div className="ch-head">
        <h2>{groupLabel}s</h2>
        <span className="ch-count">{plural(groups.length, labelLow)}</span>
        <span className="ch-hint">Tap a {labelLow} to see its lectures</span>
      </div>

      {groups.length === 0 ? (
        <div style={{ padding:48, textAlign:'center', color:'#6B7690', fontSize:14, background:'#fff', borderRadius:18, border:'1px solid #E7ECF6' }}>
          No {labelLow}s with lectures yet.
        </div>
      ) : (
        <div className="ch-grid">
          {groups.map((group, gi) => {
            const { total, quiz, pct, mastered } = groupStats(group)
            const isDone  = pct === 100
            const inProg  = pct > 0 && pct < 100
            const tileBg  = isDone ? '#E7F7EF' : inProg ? '#EEF3FF' : '#F1F4FA'
            const tileClr = isDone ? '#138A5A' : inProg ? '#2F6BFF' : '#6B7690'
            const pillBg  = isDone ? '#E7F7EF' : inProg ? '#FFF6E0' : '#F1F4FA'
            const pillClr = isDone ? '#138A5A' : inProg ? '#A1730A' : '#6B7690'
            const pillTxt = isDone ? 'Done'    : inProg ? 'In progress' : 'Not started'
            const barCls  = isDone ? 'sp-shimmer-green' : inProg ? 'sp-shimmer' : ''
            const meta    = isGuest
              ? `${plural(total, 'lecture')}${quiz > 0 ? ` · ${quiz} Q` : ''}`
              : `${plural(total, 'lecture')} · ${mastered} mastered`

            return (
              <button
                key={group.id}
                type="button"
                className={`ch-card${isGuest ? ' no-bar' : ''}`}
                onClick={() => setOpenGroupId(group.id)}
                aria-haspopup="dialog"
                style={{ animationDelay:`${0.38 + gi * 0.05}s` }}
              >
                <span className="ch-tile" style={{ background:tileBg, color:tileClr }}>
                  {isDone && !isGuest ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : pad(gi + 1)}
                </span>

                {!isGuest && <span className="ch-pill" style={{ background:pillBg, color:pillClr }}>{pillTxt}</span>}

                <span className="ch-body">
                  <span className="ch-title">{group.title}</span>
                  <span className="ch-meta">{meta}</span>
                </span>

                {!isGuest && (
                  <span className="ch-bar">
                    <span className="ch-track">
                      {barCls
                        ? <span className={`ch-fill ${barCls}`} style={{ width:`${Math.max(pct, 3)}%` }}/>
                        : <span className="ch-fill" style={{ width:'3%', background:'#C7D3EA' }}/>}
                    </span>
                    <span className="ch-pct">{pct}%</span>
                  </span>
                )}

                <span className="ch-cta">
                  View lectures
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>

                <svg className="ch-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Chapter popup ── */}
      {openGroup && (() => {
        const { total, flash, quiz, pct, mastered } = groupStats(openGroup)
        const hint = mastered === total && total > 0
          ? `Every lecture in this ${labelLow} is mastered — nice work.`
          : `${mastered} of ${total} mastered · ${total - mastered} still need a pass`

        return (
          <SubjectDialog
            open
            onClose={() => setOpenGroupId(null)}
            label={`${groupLabel}: ${openGroup.title}`}
            maxWidth={760}
            header={
              <>
                <span className="dlg-chip"><i/>{groupLabel} {pad(openIndex + 1)}</span>
                <h2 className="dlg-title">{openGroup.title}</h2>
                <div className="dlg-stats">
                  <span>{plural(total, 'lecture')}</span>
                  {flash > 0 && <span>{plural(flash, 'flashcard')}</span>}
                  {quiz  > 0 && <span>{plural(quiz, 'question')}</span>}
                </div>
                {!isGuest && (
                  <div className="dlg-progress">
                    <div className="dlg-progress-row">
                      <span className="dlg-hint">{hint}</span>
                      <span className="dlg-pct">{pct}%</span>
                    </div>
                    <div className="dlg-track">
                      <div className="sp-shimmer" style={{ height:'100%', width:`${pct}%`, borderRadius:99, transition:'width .5s ease' }}/>
                    </div>
                  </div>
                )}
              </>
            }
          >
            {isGuest && (
              <div className="dlg-guest">
                <div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#15203A' }}>Track your progress</div>
                  <div style={{ fontSize:12, color:'#6B7690', marginTop:1 }}>Create a free account to rate lectures and track your progress</div>
                </div>
                <Link href="/register" prefetch={false}>Create Free Account</Link>
              </div>
            )}

            <div className="dlg-sub">
              <h3>Lectures</h3>
              {!isGuest && <span>Tap the stars to rate your recall</span>}
            </div>

            <div className={`lec-list${isGuest ? ' is-guest' : ''}`}>
              {openGroup.lectures.map((lecture, li) => {
                const stars    = starsByLecture[lecture.id] ?? 0
                const st       = STATUS[stars] ?? STATUS[0]
                const isResume = !isGuest && lecture.id === lastLectureId
                const metaParts: string[] = []
                if (lecture.hasSheet)       metaParts.push('Sheet')
                if (lecture.flashCount > 0) metaParts.push(`${lecture.flashCount} cards`)
                if (lecture.quizCount  > 0) metaParts.push(`${lecture.quizCount} Q`)
                if (lecture.pyqCount   > 0) metaParts.push(`${lecture.pyqCount} PYQ`)
                const meta = metaParts.join(' · ')

                return (
                  <div key={lecture.id} className={`lec-row${isResume ? ' is-resume' : ''}`}>
                    <Link prefetch={false} className="lec-link" href={`/${uniSlug}/${subjectSlug}/${lecture.slug ?? lecture.id}`}>
                      <span className="lec-num" style={{ background:isGuest ? '#EEF3FF' : st.bg, color:isGuest ? '#2F6BFF' : st.color }}>
                        {pad(li + 1)}
                      </span>
                      <span className="lec-text">
                        <span className="lec-title">{lecture.title}</span>
                        <span className="lec-line">
                          {isResume && <span className="lec-resume">RESUME</span>}
                          {!isGuest && <span className="lec-status-txt" style={{ color:st.color }}>{st.label}</span>}
                          {meta && <span className="lec-meta">{meta}</span>}
                        </span>
                      </span>
                    </Link>

                    {!isGuest && userId && (
                      <div className="lec-stars">
                        <LectureStarsClient lectureId={lecture.id} initialStars={stars} userId={userId} />
                      </div>
                    )}

                    {!isGuest && (
                      <span className="lec-pill" style={{ background:st.bg, color:st.color }}>{st.label}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </SubjectDialog>
        )
      })()}
    </>
  )
}