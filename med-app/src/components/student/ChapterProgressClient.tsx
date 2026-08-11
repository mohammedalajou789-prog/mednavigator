'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import LectureStarsClient from '@/components/student/LectureStarsClient'

interface Lecture {
  id: string
  title: string
  display_order: number
  slug: string | null
}

interface ChapterProgressClientProps {
  uniSlug: string
  subjectSlug: string
  groupLabel: string
  groupTitle: string
  totalLectures: number
  totalFlash: number
  totalQuiz: number
  lectureList: Lecture[]
  initialStarsByLecture: Record<string, number>
  sheetMap: Record<string, boolean>
  flashMap: Record<string, number>
  quizMap: Record<string, number>
  userId: string | null
}

const STAR_COLORS = ['#EF4444', '#F59E0B', '#22C55E']

const STATUS: Record<number, { label: string; bg: string; color: string; iconBg: string; iconColor: string }> = {
  0: { label: 'Not started', bg: '#F1F3F9',               color: '#8892A8', iconBg: '#EEF1F8', iconColor: '#9AA4BC' },
  1: { label: 'Need review', bg: 'rgba(239,68,68,.10)',    color: '#DC2626', iconBg: '#FEF2F2', iconColor: '#EF4444' },
  2: { label: 'Almost',      bg: 'rgba(216,154,6,.12)',    color: '#A1730A', iconBg: '#FFF6E0', iconColor: '#C99400' },
  3: { label: 'Mastered',    bg: 'rgba(19,138,90,.11)',    color: '#138A5A', iconBg: '#E7F7EF', iconColor: '#17A66B' },
}

export default function ChapterProgressClient({
  uniSlug,
  subjectSlug,
  groupLabel,
  groupTitle,
  totalLectures,
  totalFlash,
  totalQuiz,
  lectureList,
  initialStarsByLecture,
  sheetMap,
  flashMap,
  quizMap,
  userId,
}: ChapterProgressClientProps) {
  const [starsByLecture, setStarsByLecture] = useState<Record<string, number>>(initialStarsByLecture)
  const [justRated, setJustRated] = useState<string | null>(null)

  useEffect(() => {
    function handleStarChanged(e: Event) {
      const { lectureId, stars } = (e as CustomEvent).detail as { lectureId: string; stars: number }
      setStarsByLecture(prev => ({ ...prev, [lectureId]: stars }))
      setJustRated(lectureId)
      setTimeout(() => setJustRated(null), 600)
    }
    window.addEventListener('star-changed', handleStarChanged)
    return () => window.removeEventListener('star-changed', handleStarChanged)
  }, [])

  const isGuest = !userId

  const totalStars      = lectureList.reduce((s, l) => s + (starsByLecture[l.id] ?? 0), 0)
  const progressPercent = totalLectures > 0 ? Math.round((totalStars / (totalLectures * 3)) * 100) : 0
  const masteredCount   = lectureList.filter(l => (starsByLecture[l.id] ?? 0) === 3).length

  const hint = masteredCount === totalLectures && totalLectures > 0
    ? 'Every lecture in this chapter is mastered — nice work.'
    : `${masteredCount} of ${totalLectures} lectures mastered · ${totalLectures - masteredCount} still need a pass`

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)} }
        @keyframes barIn     { from{transform:scaleX(0)}to{transform:scaleX(1)} }
        @keyframes shimmer   { 0%{background-position:-160% 0}55%,100%{background-position:260% 0} }
        @keyframes glowDrift { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-26px,14px) scale(1.12)} }
        @keyframes floaty    { 0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)} }
        @keyframes starPop   { 0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)} }

        .shimmer-bar {
          background:linear-gradient(100deg,#3B79FF 0%,#3B79FF 42%,#A9C4FF 52%,#2456D6 62%,#2456D6 100%);
          background-size:260% 100%;
          transform-origin:left;
          animation:barIn 1.1s cubic-bezier(.4,0,.2,1) .4s backwards, shimmer 3.6s ease-in-out 1.6s infinite;
        }
        .lec-card { transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .lec-card:hover { transform:translateY(-3px); border-color:#C2D4FF !important; box-shadow:0 20px 36px -26px rgba(40,90,200,.95) !important; }
        .star-btn { background:none; border:none; padding:3px; cursor:pointer; display:flex; line-height:0; transition:transform .18s ease; }
        .star-btn:hover { transform:scale(1.18); }
        .view-link { transition:transform .2s ease; }
        .view-link:hover { transform:translateX(4px); }

        /* Responsive hero */
        .ch-hero-ring { display:none; }
        .ch-hero-pbar { display:block; }
        @media(min-width:640px) {
          .ch-hero-ring { display:flex; flex-shrink:0; animation:floaty 6s ease-in-out 1.4s infinite; }
          .ch-hero-pbar { display:none; }
        }

        /* Responsive lecture card */
        .lec-status { display:none; }
        @media(min-width:640px) {
          .lec-status { display:inline-flex; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{ position:'relative', overflow:'hidden', borderRadius:24, marginBottom:'clamp(18px,3vw,28px)', padding:'clamp(20px,3vw,32px)', background:'linear-gradient(120deg,#EDF3FF 0%,#F3F7FF 52%,#FCFDFF 100%)', border:'1px solid #E2EAFB', boxShadow:'0 1px 2px rgba(16,24,40,.04),0 24px 50px -34px rgba(40,90,200,.5)', animation:'fadeUp .55s ease .04s backwards' }}>
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:-100, right:120, width:360, height:250, background:'radial-gradient(rgba(147,197,253,.42) 0%,rgba(196,181,253,.16) 55%,transparent 75%)', filter:'blur(36px)', pointerEvents:'none', animation:'glowDrift 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:-130, left:-70, width:320, height:250, background:'radial-gradient(rgba(129,224,193,.26) 0%,transparent 70%)', filter:'blur(42px)', pointerEvents:'none', animation:'glowDrift 15s ease-in-out 2s infinite' }}/>

        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:'clamp(20px,4vw,34px)', flexWrap:'wrap' }}>
          {/* Left */}
          <div style={{ flex:1, minWidth:'min(100%,280px)' }}>
            {/* Chapter pill */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontWeight:800, letterSpacing:'.09em', textTransform:'uppercase', color:'#2F6BFF', background:'rgba(47,107,255,.09)', padding:'5px 11px', borderRadius:99, animation:'fadeUp .5s ease .1s backwards' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#2F6BFF' }}/>
              <span>{groupLabel}</span>
            </div>

            <h1 style={{ fontSize:'clamp(26px,5vw,36px)', lineHeight:1.06, fontWeight:800, letterSpacing:'-.03em', color:'#15203A', marginTop:12, animation:'fadeUp .55s ease .14s backwards' }}>
              {groupTitle}
            </h1>

            {/* Stat pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:700, color:'#55617D', background:'rgba(255,255,255,.8)', border:'1px solid #E2EAFB', padding:'6px 12px', borderRadius:99, animation:'fadeUp .5s ease .2s backwards' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                {totalLectures} lecture{totalLectures!==1?'s':''}
              </span>
              {totalFlash > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:700, color:'#55617D', background:'rgba(255,255,255,.8)', border:'1px solid #E2EAFB', padding:'6px 12px', borderRadius:99, animation:'fadeUp .5s ease .24s backwards' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C99400" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 3h12"/></svg>
                  {totalFlash} flashcard{totalFlash!==1?'s':''}
                </span>
              )}
              {totalQuiz > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:700, color:'#55617D', background:'rgba(255,255,255,.8)', border:'1px solid #E2EAFB', padding:'6px 12px', borderRadius:99, animation:'fadeUp .5s ease .28s backwards' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#17A66B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {totalQuiz} question{totalQuiz!==1?'s':''}
                </span>
              )}
            </div>
          </div>

          {/* Progress ring — tablet/desktop */}
          {!isGuest && (
            <div className="ch-hero-ring" style={{ position:'relative', width:132, height:132 }}>
              <svg width="132" height="132" viewBox="0 0 132 132">
                <defs>
                  <linearGradient id="chRing2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3B79FF"/><stop offset="1" stopColor="#2456D6"/>
                  </linearGradient>
                </defs>
                <circle cx="66" cy="66" r="52" fill="none" stroke="#E1E9FA" strokeWidth="12" pathLength="100" strokeDasharray="2.3 2.7" transform="rotate(-90 66 66)"/>
                <circle cx="66" cy="66" r="52" fill="none" stroke="url(#chRing2)" strokeWidth="16" pathLength="100"
                  strokeDasharray={`${progressPercent} ${100-progressPercent}`}
                  transform="rotate(-90 66 66)"
                  style={{ transition:'stroke-dasharray .7s cubic-bezier(.4,0,.2,1)' }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:23, fontWeight:800, color:'#2456D6', letterSpacing:'-.03em', lineHeight:1 }}>{progressPercent}%</div>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#9AA6BE', marginTop:4 }}>{masteredCount} of {totalLectures}</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar — full width — only for logged in */}
        {!isGuest && (
          <>
            <div style={{ position:'relative', marginTop:22, height:8, borderRadius:99, background:'rgba(225,233,250,.9)', overflow:'hidden' }}>
              <div className="shimmer-bar" style={{ height:'100%', width:`${progressPercent}%`, borderRadius:99 }}/>
            </div>
            <p style={{ position:'relative', fontSize:12.5, fontWeight:600, color:'#8892A8', marginTop:9 }}>{hint}</p>
          </>
        )}

        {/* Mobile progress bar */}
        {!isGuest && (
          <div className="ch-hero-pbar" style={{ marginTop:14, width:'100%' }}>
            {/* already shown via the full-width bar above — hidden on desktop via CSS */}
          </div>
        )}
      </section>

      {/* Guest banner */}
      {isGuest && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', background:'linear-gradient(120deg,rgba(37,99,235,0.06),rgba(124,58,237,0.04))', border:'1px solid rgba(37,99,235,0.15)', borderRadius:14, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(37,99,235,.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <div>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#15203A' }}>Track your progress</div>
              <div style={{ fontSize:12, color:'#8892A8', marginTop:1 }}>Create a free account to rate lectures and track your progress</div>
            </div>
          </div>
          <Link href="/register" prefetch={false} style={{ display:'inline-flex', alignItems:'center', gap:6, height:38, padding:'0 16px', borderRadius:10, background:'#2563EB', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
            Create Free Account
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      )}

      {/* ── Lectures ── */}
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:14, flexWrap:'wrap', animation:'fadeUp .5s ease .4s backwards' }}>
        <h2 style={{ margin:0, fontSize:19, fontWeight:800, letterSpacing:'-.02em', color:'#15203A' }}>Lectures</h2>
        <span style={{ fontSize:13, fontWeight:700, color:'#2F6BFF' }}>{totalLectures} lecture{totalLectures!==1?'s':''}</span>
        {!isGuest && <span style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color:'#8892A8' }}>Tap the stars to rate your recall</span>}
      </div>

      {lectureList.length === 0 ? (
        <div style={{ padding:48, textAlign:'center', color:'#8892A8', fontSize:14 }}>
          No lectures in this {groupLabel.toLowerCase()} yet.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {lectureList.map((lecture, li) => {
            const stars    = starsByLecture[lecture.id] ?? 0
            const st       = STATUS[stars]
            const lectSlug = lecture.slug ?? lecture.id
            const metaParts: string[] = []
            if (sheetMap[lecture.id])             metaParts.push('Sheet')
            if ((flashMap[lecture.id] ?? 0) > 0) metaParts.push(`${flashMap[lecture.id]} cards`)
            if ((quizMap[lecture.id]  ?? 0) > 0) metaParts.push(`${quizMap[lecture.id]} Q`)
            const meta  = metaParts.join(' · ')
            const delay = `${(0.44 + 0.06 * li).toFixed(2)}s`

            return (
              <div key={lecture.id} className="lec-card" style={{ borderRadius:18, border:'1px solid #E7ECF6', background:'#fff', padding:'18px 20px', boxShadow:'0 1px 2px rgba(16,24,40,.04)', animation:'fadeUp .5s ease backwards', animationDelay:delay }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>

                  {/* Number badge */}
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:46, height:46, borderRadius:13, background:st.iconBg, color:st.iconColor, flexShrink:0, fontSize:14, fontWeight:800, letterSpacing:'-.02em', transition:'background .3s ease,color .3s ease' }}>
                    {String(li + 1).padStart(2, '0')}
                  </span>

                  {/* Title + meta */}
                  <div style={{ flex:1, minWidth:'min(100%,200px)' }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#15203A', lineHeight:1.35 }}>{lecture.title}</div>
                    {meta && <div style={{ fontSize:12, fontWeight:600, color:'#9AA4BC', marginTop:4 }}>{meta}</div>}
                  </div>

                  {/* Stars */}
                  {!isGuest && (
                    <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                      <LectureStarsClient
                        lectureId={lecture.id}
                        initialStars={stars}
                        userId={userId!}
                      />
                    </div>
                  )}

                  {/* Status badge */}
                  {!isGuest && (
                    <span className="lec-status" style={{ padding:'5px 11px', borderRadius:9, fontSize:11, fontWeight:700, flexShrink:0, background:st.bg, color:st.color, transition:'background .3s ease,color .3s ease' }}>
                      {st.label}
                    </span>
                  )}

                  {/* View link */}
                  <Link className="view-link" prefetch={false} href={`/${uniSlug}/${subjectSlug}/${lectSlug}`} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:13, fontWeight:800, color:'#2F6BFF', flexShrink:0, textDecoration:'none' }}>
                    <span>View</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}