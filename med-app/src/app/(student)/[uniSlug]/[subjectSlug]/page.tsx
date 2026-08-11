import { getUserProfile } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BfCacheReloader from '@/components/student/BfCacheReloader'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params
  const supabase = await createServerClient()

  const [{ data: uniRow }, { data: subRow }, profile] = await Promise.all([
    supabase.from('universities').select('id, name').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id, name, description, access_mode, subject_type').eq('slug' as any, subjectSlug).eq('is_published', true).single(),
    getUserProfile(),
  ])
  if (!uniRow || !subRow) notFound()

  const subjectId = subRow.id
  const userId    = profile?.id ?? null
  const isSystem  = subRow.subject_type === 'system'

  const [rpcResult, { data: videos }, { data: clinicalModules }] = await Promise.all([
    (supabase as any).rpc('get_subject_page_data', {
      p_subject_id: subjectId,
      p_is_system:  isSystem,
      p_user_id:    userId ?? null,
    }),
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])

  const rpcData   = rpcResult.data ?? {}
  const groups    = (rpcData.groups   ?? []) as any[]
  const lectures  = (rpcData.lectures ?? []) as any[]
  const checklist = (rpcData.checklist ?? {}) as Record<string, number>
  const lastLectureId = rpcData.last_lecture?.lecture_id ?? null

  const lectureList   = lectures
  const totalLectures = lectureList.length

  const flashMap: Record<string, number> = {}
  const quizMap:  Record<string, number> = {}
  const pyqMap:   Record<string, number> = {}
  lectureList.forEach((l: any) => {
    if (l.flash_count) flashMap[l.id] = l.flash_count
    if (l.quiz_count)  quizMap[l.id]  = l.quiz_count
    if (l.pyq_count)   pyqMap[l.id]   = l.pyq_count
  })

  const starsByLecture  = checklist
  const totalStars      = Object.values(starsByLecture).reduce((s: number, n: any) => s + n, 0)
  const progressPercent = totalLectures > 0 ? Math.round((totalStars / (totalLectures * 3)) * 100) : 0

  const lastAccessedLecture = lastLectureId
    ? lectureList.find((l: any) => l.id === lastLectureId) ?? null
    : null

  const groupStats = groups.map((group: any) => {
    const gLectures = lectureList.filter((l: any) => isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id)
    const gTotal    = gLectures.length
    const gStars    = gLectures.reduce((s: number, l: any) => s + (starsByLecture[l.id] ?? 0), 0)
    const gFlash    = gLectures.reduce((s: number, l: any) => s + (flashMap[l.id] ?? 0), 0)
    const gQuiz     = gLectures.reduce((s: number, l: any) => s + (quizMap[l.id]  ?? 0), 0)
    const gPyq      = gLectures.reduce((s: number, l: any) => s + (pyqMap[l.id]   ?? 0), 0)
    const gPct      = gTotal > 0 ? Math.round((gStars / (gTotal * 3)) * 100) : 0
    // top 3 lectures for preview
    const gLecturesSorted = gLectures.slice(0, 3)
    return { group, gTotal, gStars, gFlash, gQuiz, gPyq, gPct, gLecturesSorted }
  }).filter((s: any) => s.gTotal > 0)

  const typeBadge   = subRow.subject_type === 'system' ? 'System' : subRow.subject_type === 'standard' ? 'Standard' : 'Clinical'
  const accessBadge = subRow.access_mode  === 'free'   ? 'Free'   : subRow.access_mode  === 'mixed'    ? 'Mixed'    : 'Premium'
  const groupLabel  = isSystem ? 'Sub-Subject' : 'Chapter'

  const moduleLabels: Record<string, string> = {
    osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam',
  }

  // Continue learning: last lecture star rating
  const lastLecStars = lastLectureId ? (starsByLecture[lastLectureId] ?? 0) : 0
  const lastLecLabel = lastLecStars === 3 ? 'Mastered' : lastLecStars === 2 ? 'Almost there' : lastLecStars === 1 ? 'Need review' : 'Not rated'

  // Video dots for sidebar
  const videoDots = videos ? Math.min(videos.length, 6) : 0
  const videoFilledDots = videos ? Math.min(Math.ceil(videos.length / 2), videoDots) : 0

  return (
    <div style={{ minHeight:'100vh', background:'rgb(245,247,252)', fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', color:'rgb(60,70,97)' }}>
      <BfCacheReloader />
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)} }
        @keyframes barIn    { from{transform:scaleX(0)}to{transform:scaleX(1)} }
        @keyframes shimmer  { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes floaty   { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
        @keyframes glowDrift{ 0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-14px)} }
        @keyframes pulseRing{ 0%{transform:scale(1);opacity:.5}70%{transform:scale(1.55);opacity:0}100%{transform:scale(1.55);opacity:0} }
        .shimmer-blue {
          background:linear-gradient(100deg,#3B79FF 0%,#3B79FF 42%,#A9C4FF 52%,#2456D6 62%,#2456D6 100%);
          background-size:260% 100%;
          animation:barIn 1s cubic-bezier(.4,0,.2,1) .5s backwards, shimmer 3.6s ease-in-out 1.6s infinite;
        }
        .shimmer-green {
          background:linear-gradient(100deg,#17A66B 0%,#17A66B 42%,#7EE2B3 52%,#108051 62%,#108051 100%);
          background-size:260% 100%;
          animation:barIn 1s cubic-bezier(.4,0,.2,1) .5s backwards, shimmer 3.6s ease-in-out 1.8s infinite;
        }
        .chapter-card { transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease; }
        .chapter-card:hover { transform:translateY(-3px); border-color:#C2D4FF !important; box-shadow:0 22px 40px -26px rgba(40,90,200,.9) !important; }
        .sidebar-link { transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .sidebar-link:hover { transform:translateX(4px); border-color:#C2D4FF !important; box-shadow:0 16px 30px -22px rgba(40,90,200,.9) !important; }
        .continue-card { transition:transform .22s ease,box-shadow .22s ease; }
        .continue-card:hover { transform:translateY(-3px); box-shadow:0 22px 38px -22px rgba(37,99,235,.5) !important; }
        .resume-btn { transition:transform .2s ease,box-shadow .2s ease,background .2s ease; }
        .resume-btn:hover { transform:translateX(3px); background:#1D4ED8 !important; box-shadow:0 12px 22px -12px rgba(37,99,235,.9) !important; }
        .lec-row { transition:background .2s ease,transform .2s ease; }
        .lec-row:hover { background:#EBF1FB !important; transform:translateX(3px); }

        /* Responsive */
        .subject-main { padding:20px 16px 80px; }
        .hero-section { padding:20px 18px; }
        .hero-inner   { flex-direction:column; gap:20px; }
        .hero-ring    { display:none; }
        .hero-pbar    { display:block; }
        .hero-title   { font-size:28px; }
        .cont-inner   { flex-wrap:wrap; gap:14px; padding:16px; }
        .cont-stars   { display:none; }
        .cont-resume  { width:100%; justify-content:center; }
        .subj-grid    { grid-template-columns:1fr; gap:20px; }
        .chap-pad     { padding:16px; gap:12px; }
        .chap-view    { display:none; }
        @media(min-width:640px){
          .subject-main { padding:24px 24px 80px; }
          .hero-section { padding:24px 28px; }
          .hero-title   { font-size:34px; }
          .cont-inner   { flex-wrap:nowrap; padding:18px 20px; }
          .cont-stars   { display:block; }
          .cont-resume  { width:auto; }
        }
        @media(min-width:900px){
          .subject-main { padding:30px 34px 80px; }
          .hero-section { padding:clamp(20px,3vw,32px); }
          .hero-inner   { flex-direction:row; gap:clamp(20px,4vw,36px); }
          .hero-ring    { display:flex; }
          .hero-pbar    { display:none; }
          .hero-title   { font-size:clamp(28px,5vw,42px); }
          .subj-grid    { grid-template-columns:1fr 348px; gap:clamp(18px,3vw,34px); }
          .chap-pad     { padding:20px 22px; gap:16px; }
          .chap-view    { display:inline-flex; }
        }
      `}</style>

      <main className="subject-main">

        {/* Breadcrumb */}
        <nav style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, fontWeight:600, marginBottom:18, flexWrap:'wrap', animation:'slideIn .45s ease backwards' }}>
          <Link prefetch={false} href="/home" style={{ color:'rgb(107,118,144)', textDecoration:'none' }}>Home</Link>
          <span style={{ color:'rgb(194,202,219)' }}>/</span>
          <Link prefetch={false} href={`/${uniSlug}`} style={{ color:'rgb(107,118,144)', textDecoration:'none' }}>{uniRow.name}</Link>
          <span style={{ color:'rgb(194,202,219)' }}>/</span>
          <span style={{ color:'rgb(21,32,58)' }}>{subRow.name}</span>
        </nav>

        {/* ── Hero ── */}
        <section className="hero-section" style={{ position:'relative', overflow:'hidden', borderRadius:24, marginBottom:20, background:'linear-gradient(120deg,#EDF3FF 0%,#F3F7FF 52%,#FCFDFF 100%)', border:'1px solid #E2EAFB', boxShadow:'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.5) 0px 24px 50px -34px', animation:'fadeUp .55s ease .04s backwards' }}>
          {/* Glow blobs */}
          <div style={{ position:'absolute', top:-90, right:180, width:340, height:230, background:'radial-gradient(rgba(147,197,253,.4) 0%,rgba(196,181,253,.16) 55%,transparent 75%)', filter:'blur(34px)', pointerEvents:'none', animation:'glowDrift 11s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', bottom:-120, left:-60, width:300, height:240, background:'radial-gradient(rgba(129,224,193,.28) 0%,transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'glowDrift 14s ease-in-out 2s infinite' }}/>

          <div className="hero-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative' }}>
            <div style={{ minWidth:0, flex:1 }}>
              {/* Badges */}
              <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'#E7F7EF', border:'1px solid #C7EBD8', color:'#138A5A', fontSize:12, fontWeight:700, animation:'fadeUp .5s ease .12s backwards' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#17A66B' }}/>
                  {typeBadge}
                </span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'#FFF6E0', border:'1px solid #F3E1AE', color:'#A1730A', fontSize:12, fontWeight:700, animation:'fadeUp .5s ease .18s backwards' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {accessBadge}
                </span>
              </div>

              <h1 className="hero-title" style={{ margin:0, lineHeight:1.06, fontWeight:800, letterSpacing:'-.03em', color:'#15203A', animation:'fadeUp .55s ease .1s backwards' }}>{subRow.name}</h1>

              {subRow.description && (
                <p style={{ marginTop:12, fontSize:14.5, lineHeight:1.6, color:'#55617D', maxWidth:560, animation:'fadeUp .55s ease .16s backwards' }}>{subRow.description}</p>
              )}

              {/* Stat pills */}
              <div style={{ display:'flex', gap:14, marginTop:20, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.75)', border:'1px solid #E2EAFB', borderRadius:14, padding:'10px 14px', animation:'fadeUp .5s ease .22s backwards' }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:9, background:'#fff', border:'1px solid #E2EAFB', color:'#2F6BFF' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  </span>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:'#15203A', lineHeight:1 }}>{totalLectures}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:2 }}>Lecture{totalLectures!==1?'s':''}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.75)', border:'1px solid #E2EAFB', borderRadius:14, padding:'10px 14px', animation:'fadeUp .5s ease .26s backwards' }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:9, background:'#fff', border:'1px solid #E2EAFB', color:'#2F6BFF' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                  </span>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:'#15203A', lineHeight:1 }}>{groupStats.length}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:2 }}>{groupLabel}{groupStats.length!==1?'s':''}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress ring — desktop only */}
            {userId && (
              <div className="hero-ring" style={{ flexShrink:0, flexDirection:'column', alignItems:'center', animation:'floaty 6s ease-in-out 1.4s infinite' }}>
                <div style={{ position:'relative', width:140, height:140 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <defs>
                      <linearGradient id="pgGrad2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#3B79FF"/><stop offset="1" stopColor="#2456D6"/>
                      </linearGradient>
                    </defs>
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#E1E9FA" strokeWidth="13" pathLength="100" strokeDasharray="2.3 2.7" transform="rotate(-90 70 70)"/>
                    <circle cx="70" cy="70" r="55" fill="none" stroke="url(#pgGrad2)" strokeWidth="17" pathLength="100"
                      strokeDasharray={`${progressPercent} ${100-progressPercent}`}
                      transform="rotate(-90 70 70)"
                      style={{ transition:'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1) .4s' }}/>
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:'#2456D6', letterSpacing:'-.03em', lineHeight:1 }}>
                      {progressPercent}<span style={{ fontSize:13, color:'#8DA5DC' }}>%</span>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9AA6BE', marginTop:4 }}>
                      {Math.floor(totalStars/3)} of {totalLectures}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar — mobile only */}
            {userId && (
              <div className="hero-pbar" style={{ marginTop:16, width:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#8892A8' }}>Overall Progress</span>
                  <span style={{ fontSize:20, fontWeight:800, color:'#2456D6', letterSpacing:'-.02em' }}>{progressPercent}%</span>
                </div>
                <div style={{ height:8, borderRadius:999, background:'#E1E9FA', overflow:'hidden' }}>
                  <div className="shimmer-blue" style={{ height:'100%', width:`${progressPercent}%`, borderRadius:999, transformOrigin:'left' }}/>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:6 }}>{Math.floor(totalStars/3)} of {totalLectures} lectures mastered</div>
              </div>
            )}
          </div>
        </section>

        {/* ── Continue Learning ── */}
        {userId && lastAccessedLecture && (
          <div className="continue-card" style={{ background:'linear-gradient(120deg,rgba(37,99,235,.07),#fff 62%)', border:'1px solid #E2E8F0', borderRadius:18, overflow:'hidden', marginBottom:26, boxShadow:'rgba(15,23,42,0.04) 0px 1px 3px,rgba(15,23,42,0.22) 0px 12px 26px -18px', animation:'fadeUp .55s ease .3s backwards' }}>
            <div className="cont-inner" style={{ display:'flex', alignItems:'center', gap:16 }}>
              {/* Play button with pulse */}
              <div style={{ position:'relative', width:46, height:46, flexShrink:0 }}>
                <span style={{ position:'absolute', inset:0, borderRadius:14, background:'rgba(37,99,235,.45)', animation:'pulseRing 2.6s ease-out 1.4s infinite' }}/>
                <div style={{ position:'relative', width:46, height:46, borderRadius:14, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 16px rgba(37,99,235,.4)' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff"><polygon points="7 4 20 12 7 20 7 4"/></svg>
                </div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', color:'#2563EB', marginBottom:3 }}>CONTINUE LEARNING</div>
                <div style={{ fontSize:17, fontWeight:700, letterSpacing:'-.01em', color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(lastAccessedLecture as any).title}</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Pick up where you left off</div>
              </div>
              <div className="cont-stars" style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ display:'flex', gap:3 }}>
                  {[1,2,3].map(i => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                      fill={i<=lastLecStars?(i===1?'#EF4444':i===2?'#F59E0B':'#22C55E'):'none'}
                      stroke={i<=lastLecStars?(i===1?'#EF4444':i===2?'#F59E0B':'#22C55E'):'#CBD5E1'}
                      strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginTop:4 }}>{lastLecLabel}</div>
              </div>
              <Link prefetch={false} className="cont-resume resume-btn"
                href={`/${uniSlug}/${subjectSlug}/${(lastAccessedLecture as any).slug ?? (lastAccessedLecture as any).id}`}
                style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:8, height:44, padding:'0 20px', borderRadius:12, background:'#2563EB', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none' }}>
                <span>Resume</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
            {/* Shimmer progress bar */}
            <div style={{ height:4, background:'rgba(37,99,235,.12)' }}>
              <div className="shimmer-blue" style={{ height:'100%', width:`${progressPercent}%`, transformOrigin:'left' }}/>
            </div>
          </div>
        )}

        {/* ── Grid: Chapters + Sidebar ── */}
        <div className="subj-grid" style={{ display:'grid', alignItems:'start' }}>

          {/* LEFT — Chapters */}
          <div>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:14, animation:'fadeUp .5s ease .34s backwards' }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:'-.02em', color:'#15203A' }}>{groupLabel}s</h2>
              <span style={{ fontSize:13, fontWeight:700, color:'#2F6BFF' }}>{groupStats.length} {groupLabel.toLowerCase()}{groupStats.length!==1?'s':''}</span>
              <span style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color:'#8892A8' }}>Tap a chapter to open</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {groupStats.map(({ group, gTotal, gFlash, gQuiz, gPyq, gPct, gLecturesSorted }: any, gi: number) => {
                const isDone    = gPct === 100
                const inProg    = gPct > 0 && gPct < 100
                const badgeBg   = isDone ? '#E7F7EF' : inProg ? '#FFF6E0' : '#EEF1F8'
                const badgeBdr  = isDone ? '#C7EBD8' : inProg ? '#F3E1AE' : '#DEE2EE'
                const badgeClr  = isDone ? '#138A5A' : inProg ? '#A1730A' : '#8892A8'
                const badgeTxt  = isDone ? 'Done'    : inProg ? `${gPct}% · in progress` : 'Not started'
                const iconBg    = isDone ? '#E7F7EF' : inProg ? '#EEF3FF' : '#F1F4FA'
                const iconClr   = isDone ? '#138A5A' : inProg ? '#2F6BFF' : '#8892A8'
                const barClass  = isDone ? 'shimmer-green' : inProg ? 'shimmer-blue' : ''

                return (
                  <div key={group.id} className="chapter-card" style={{ borderRadius:18, border:'1px solid #E7ECF6', background:'#fff', boxShadow:'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.7) 0px 14px 34px -26px', overflow:'hidden', animation:'fadeUp .5s ease backwards', animationDelay:`${0.38+gi*0.06}s` }}>
                    <Link prefetch={false} href={`/${uniSlug}/${subjectSlug}/chapter/${(group as any).slug ?? group.id}`} style={{ textDecoration:'none', color:'inherit', display:'flex', alignItems:'center', gap:16, padding:'20px 22px', cursor:'pointer' }} className="chap-pad">
                      {/* Icon */}
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:46, height:46, borderRadius:13, background:iconBg, color:iconClr, flexShrink:0 }}>
                        {isDone ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        )}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#15203A', letterSpacing:'-.01em' }}>{group.title}</h3>
                          {userId && <span style={{ padding:'2px 9px', borderRadius:999, background:badgeBg, border:`1px solid ${badgeBdr}`, color:badgeClr, fontSize:11, fontWeight:700 }}>{badgeTxt}</span>}
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:6, fontSize:12.5, fontWeight:600, color:'#8892A8' }}>
                          <span>{gTotal} lecture{gTotal!==1?'s':''}</span>
                          {gFlash>0 && <span>{gFlash} flashcard{gFlash!==1?'s':''}</span>}
                          {gQuiz>0  && <span>{gQuiz} Q</span>}
                          {gPyq>0   && <span>{gPyq} PYQ</span>}
                        </div>
                        <div style={{ marginTop:12, height:6, borderRadius:999, background:'#EAF0FB', overflow:'hidden' }}>
                          {barClass ? (
                            <div className={barClass} style={{ height:'100%', width:`${Math.max(gPct,2)}%`, borderRadius:999, transformOrigin:'left' }}/>
                          ) : (
                            <div style={{ height:'100%', width:'2%', borderRadius:999, background:'#C7D3EA' }}/>
                          )}
                        </div>
                      </div>
                      <span className="chap-view" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:13, fontWeight:700, color:'#2F6BFF', flexShrink:0, marginLeft:12 }}>
                        View lectures
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <aside>
            <h2 style={{ margin:'0 0 12px', fontSize:12, fontWeight:800, letterSpacing:'.09em', textTransform:'uppercase', color:'#8892A8', animation:'fadeUp .5s ease .4s backwards' }}>More in this subject</h2>

            {/* Video Lectures */}
            {videos && videos.length > 0 && (
              <div className="sidebar-link" style={{ borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:16, marginBottom:12, animation:'fadeUp .5s ease .44s backwards' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:11, background:'#EEF3FF', color:'#2F6BFF', flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#15203A' }}>Video Lectures</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>{videos[0]?.title}{videos.length>1?` · +${videos.length-1} more`:''}</div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:800, color:'#2F6BFF' }}>{videos.length}</span>
                </div>
                {/* Dot progress */}
                <div style={{ display:'flex', gap:6, marginTop:14 }}>
                  {Array.from({length:Math.min(videos.length,6)}).map((_,i) => (
                    <div key={i} style={{ flex:1, height:5, borderRadius:99, background:i<videoFilledDots?'#2F6BFF':'#DCE6FB' }}/>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Years */}
            <Link prefetch={false} href={`/${uniSlug}/${subjectSlug}/previous-years`} style={{ textDecoration:'none', display:'block', marginBottom:10, animation:'fadeUp .5s ease .48s backwards' }}>
              <div className="sidebar-link" style={{ display:'flex', alignItems:'center', gap:12, borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'14px 16px' }}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:11, background:'#EEF3FF', color:'#2F6BFF', flexShrink:0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#15203A' }}>Previous Years</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>Past papers & MCQ bank</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            {/* Quiz Bank */}
            <Link prefetch={false} href={`/${uniSlug}/${subjectSlug}/quiz-bank`} style={{ textDecoration:'none', display:'block', marginBottom:10, animation:'fadeUp .5s ease .52s backwards' }}>
              <div className="sidebar-link" style={{ display:'flex', alignItems:'center', gap:12, borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'14px 16px' }}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:11, background:'#E7F7EF', color:'#17A66B', flexShrink:0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#15203A' }}>Quiz Bank</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>All quiz questions in one place</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            {/* Flashcards Bank */}
            <Link prefetch={false} href={`/${uniSlug}/${subjectSlug}/flashcards-bank`} style={{ textDecoration:'none', display:'block', marginBottom:10, animation:'fadeUp .5s ease .56s backwards' }}>
              <div className="sidebar-link" style={{ display:'flex', alignItems:'center', gap:12, borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'14px 16px' }}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:11, background:'#FFF6E0', color:'#C99400', flexShrink:0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 3h12"/><path d="M4 6h16"/></svg>
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#15203A' }}>Flashcards Bank</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>All flashcards in one place</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            {/* Clinical Modules */}
            {clinicalModules && clinicalModules.length > 0 && (
              <div style={{ borderRadius:14, border:'1px solid #E7ECF6', background:'#fff', marginBottom:10, overflow:'hidden', animation:'fadeUp .5s ease .60s backwards' }}>
                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:10, background:'#E7F7EF', color:'#17A66B', flexShrink:0 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><path d="M16 11V3"/><path d="M8 2v3a4 4 0 0 0 8 0V2"/></svg>
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#15203A' }}>OSCE & Oral</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>Clinical examination</div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:800, color:'#17A66B' }}>{clinicalModules.length}</span>
                </div>
                {clinicalModules.map((mod: any) => (
                  <div key={mod.id}>
                    <div style={{ height:1, background:'#E7ECF6', margin:'0 16px' }}/>
                    <Link prefetch={false} href={`/${uniSlug}/${subjectSlug}/clinical/${mod.id}`} style={{ padding:'11px 16px', display:'flex', alignItems:'center', gap:9, textDecoration:'none', color:'inherit' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#17A66B' }}/>
                      <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#55617D' }}>{moduleLabels[mod.module_type] ?? mod.module_type}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}