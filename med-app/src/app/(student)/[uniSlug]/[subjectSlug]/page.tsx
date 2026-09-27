import { getUserProfile } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BfCacheReloader from '@/components/student/BfCacheReloader'
import SubjectChaptersClient, { type SubjectGroupItem, type SubjectLectureItem } from '@/components/student/SubjectChaptersClient'
import MoreInSubjectButton from '@/components/student/MoreInSubjectButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params
  const supabase = await createServerClient()

  // ── Wave 1: university + profile in parallel ─────────────────────────────
  const [{ data: uniRow }, profile] = await Promise.all([
    supabase.from('universities').select('id, name').eq('slug' as any, uniSlug).single(),
    getUserProfile(),
  ])
  if (!uniRow) notFound()

  // ── Wave 2: subject — scoped to THIS university (Spec §3.3 University Independence)
  const { data: subRow } = await supabase
    .from('subjects')
    .select('id, name, description, access_mode, subject_type')
    .eq('university_id', uniRow.id)
    .eq('slug' as any, subjectSlug)
    .eq('is_published', true)
    .single()
  if (!subRow) notFound()

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

  const rpcData       = rpcResult.data ?? {}
  const groups        = (rpcData.groups   ?? []) as any[]
  const lectures      = (rpcData.lectures ?? []) as any[]
  const checklist     = (rpcData.checklist ?? {}) as Record<string, number>
  const lastLectureId = rpcData.last_lecture?.lecture_id ?? null

  const totalLectures = lectures.length

  // Chapters / Sub-Subjects with their lectures, in RPC order (only groups that have lectures)
  const groupItems: SubjectGroupItem[] = groups
    .map((group: any) => ({
      id:    group.id as string,
      title: group.title as string,
      lectures: lectures
        .filter((l: any) => isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id)
        .map((l: any): SubjectLectureItem => ({
          id:         l.id,
          title:      l.title,
          slug:       l.slug ?? null,
          flashCount: l.flash_count ?? 0,
          quizCount:  l.quiz_count  ?? 0,
          pyqCount:   l.pyq_count   ?? 0,
          hasSheet:   !!l.has_sheet,
        })),
    }))
    .filter((g: SubjectGroupItem) => g.lectures.length > 0)

  const totalFlash = lectures.reduce((s: number, l: any) => s + (l.flash_count ?? 0), 0)
  const totalQuiz  = lectures.reduce((s: number, l: any) => s + (l.quiz_count  ?? 0), 0)
  const totalPyq   = lectures.reduce((s: number, l: any) => s + (l.pyq_count   ?? 0), 0)

  const starsByLecture  = checklist
  const totalStars      = Object.values(starsByLecture).reduce((s: number, n: any) => s + n, 0)
  const progressPercent = totalLectures > 0 ? Math.round((totalStars / (totalLectures * 3)) * 100) : 0

  const lastAccessedLecture = lastLectureId
    ? lectures.find((l: any) => l.id === lastLectureId) ?? null
    : null

  const lastLecStars = lastLectureId ? (starsByLecture[lastLectureId] ?? 0) : 0
  const lastLecLabel = lastLecStars === 3 ? 'Mastered' : lastLecStars === 2 ? 'Almost there' : lastLecStars === 1 ? 'Need review' : 'Not rated'

  const typeBadge  = subRow.subject_type === 'system' ? 'System' : subRow.subject_type === 'standard' ? 'Standard' : 'Clinical'
  const accBadge   = subRow.access_mode  === 'free'   ? 'Free'   : subRow.access_mode  === 'mixed'    ? 'Mixed'    : 'Premium'
  const groupLabel = isSystem ? 'Sub-Subject' : 'Chapter'

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FC', color:'#3C4661', fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif' }}>
      <BfCacheReloader />
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)} }
        @keyframes barIn     { from{transform:scaleX(0)}to{transform:scaleX(1)} }
        @keyframes shimmer   { 0%{background-position:-160% 0}55%,100%{background-position:260% 0} }
        @keyframes glowDrift { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-26px,14px) scale(1.12)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.5}70%,100%{transform:scale(1.9);opacity:0} }
        @keyframes countUp   { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes floaty    { 0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)} }

        .shimmer-blue {
          background:linear-gradient(100deg,#3B79FF 0%,#3B79FF 38%,#A9C4FF 50%,#2456D6 62%,#2456D6 100%);
          background-size:260% 100%;
          transform-origin:left;
          animation:barIn 1s cubic-bezier(.4,0,.2,1) .5s backwards, shimmer 3.6s ease-in-out 1.6s infinite;
        }
        .shimmer-green {
          background:linear-gradient(100deg,#17A66B 0%,#17A66B 38%,#7EE2B3 50%,#108051 62%,#108051 100%);
          background-size:260% 100%;
          transform-origin:left;
          animation:barIn 1s cubic-bezier(.4,0,.2,1) .5s backwards, shimmer 3.6s ease-in-out 1.8s infinite;
        }
        .cont-card { transition:transform .22s ease,box-shadow .22s ease; }
        .cont-card:hover { transform:translateY(-3px); box-shadow:0 22px 38px -22px rgba(37,99,235,.5) !important; }
        .resume-btn { transition:transform .2s ease,box-shadow .2s ease,background .2s ease; }
        .resume-btn:hover { transform:translateX(3px); background:#1D4ED8 !important; box-shadow:0 12px 22px -12px rgba(37,99,235,.9) !important; }
        .stat-pill { transition:transform .2s ease,box-shadow .2s ease; }
        .stat-pill:hover { transform:translateY(-2px); box-shadow:0 12px 22px -16px rgba(40,90,200,.6) !important; }

        /* Responsive */
        .s-main  { padding:clamp(18px,3vw,30px) clamp(16px,3vw,34px) 80px; }
        .hero-inner { flex-direction:column; gap:20px; }
        .hero-ring  { display:none !important; }
        .hero-pbar  { display:block !important; }
        .hero-title { font-size:clamp(26px,6vw,42px); }
        .cont-inner { flex-wrap:wrap; gap:14px; padding:16px; }
        .cont-stars { display:none; }
        .cont-resume { width:100%; justify-content:center; }
        @media(min-width:640px){
          .cont-inner  { flex-wrap:nowrap; padding:18px 20px; }
          .cont-stars  { display:block; }
          .cont-resume { width:auto; }
        }
        @media(min-width:900px){
          .hero-inner { flex-direction:row; gap:clamp(20px,4vw,36px); align-items:center; }
          .hero-ring  { display:flex !important; }
          .hero-pbar  { display:none !important; }
        }
      `}</style>

      <main className="s-main">

        {/* ── Breadcrumb ── */}
        <nav style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, fontWeight:600, marginBottom:18, flexWrap:'wrap', animation:'slideIn .45s ease backwards' }}>
          <Link prefetch={false} href="/home" style={{ color:'#6B7690', textDecoration:'none' }}>Home</Link>
          <span style={{ color:'#C2CADB' }}>/</span>
          <Link prefetch={false} href={`/${uniSlug}`} style={{ color:'#6B7690', textDecoration:'none' }}>{uniRow.name}</Link>
          <span style={{ color:'#C2CADB' }}>/</span>
          <span style={{ color:'#15203A' }}>{subRow.name}</span>
        </nav>

        {/* ── Hero ── */}
        <section style={{ position:'relative', overflow:'hidden', borderRadius:24, marginBottom:20, padding:'clamp(20px,3vw,32px)', background:'linear-gradient(120deg,#EDF3FF 0%,#F3F7FF 52%,#FCFDFF 100%)', border:'1px solid #E2EAFB', boxShadow:'rgba(16,24,40,0.04) 0px 1px 2px,rgba(40,90,200,0.5) 0px 24px 50px -34px', animation:'fadeUp .55s ease .04s backwards' }}>
          {/* Glow blobs */}
          <div style={{ position:'absolute', top:-90, right:180, width:340, height:230, background:'radial-gradient(rgba(147,197,253,.4) 0%,rgba(196,181,253,.16) 55%,transparent 75%)', filter:'blur(34px)', pointerEvents:'none', animation:'glowDrift 11s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', bottom:-120, left:-60, width:300, height:240, background:'radial-gradient(rgba(129,224,193,.28) 0%,transparent 70%)', filter:'blur(40px)', pointerEvents:'none', animation:'glowDrift 14s ease-in-out 2s infinite' }}/>

          <div className="hero-inner" style={{ display:'flex', position:'relative' }}>
            {/* Left text */}
            <div style={{ flex:1, minWidth:'min(100%,300px)' }}>
              {/* Badges */}
              <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'#E7F7EF', border:'1px solid #C7EBD8', color:'#138A5A', fontSize:12, fontWeight:700, animation:'fadeUp .5s ease .12s backwards' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#17A66B' }}/>
                  {typeBadge}
                </span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'#FFF6E0', border:'1px solid #F3E1AE', color:'#A1730A', fontSize:12, fontWeight:700, animation:'fadeUp .5s ease .18s backwards' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {accBadge}
                </span>
              </div>

              <h1 className="hero-title" style={{ margin:0, lineHeight:1.06, fontWeight:800, letterSpacing:'-.03em', color:'#15203A', animation:'fadeUp .55s ease .1s backwards' }}>{subRow.name}</h1>

              {subRow.description && (
                <p style={{ marginTop:12, fontSize:14.5, lineHeight:1.6, color:'#55617D', maxWidth:560, animation:'fadeUp .55s ease .16s backwards' }}>{subRow.description}</p>
              )}

              {/* Stat pills */}
              <div style={{ display:'flex', gap:14, marginTop:20, flexWrap:'wrap' }}>
                <div className="stat-pill" style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.75)', border:'1px solid #E2EAFB', borderRadius:14, padding:'10px 14px', animation:'fadeUp .5s ease .22s backwards' }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:9, background:'#fff', border:'1px solid #E2EAFB', color:'#2F6BFF' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  </span>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:'#15203A', lineHeight:1 }}>{totalLectures}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:2 }}>Lectures</div>
                  </div>
                </div>
                <div className="stat-pill" style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.75)', border:'1px solid #E2EAFB', borderRadius:14, padding:'10px 14px', animation:'fadeUp .5s ease .26s backwards' }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:9, background:'#fff', border:'1px solid #E2EAFB', color:'#2F6BFF' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                  </span>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:'#15203A', lineHeight:1 }}>{groupItems.length}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:2 }}>{groupLabel}s</div>
                  </div>
                </div>
                <MoreInSubjectButton
                  uniSlug={uniSlug}
                  subjectSlug={subjectSlug}
                  subjectName={subRow.name}
                  pyqCount={totalPyq}
                  quizCount={totalQuiz}
                  flashCount={totalFlash}
                  videos={(videos ?? []).map((v: any) => ({ id: v.id as string, title: v.title as string }))}
                  clinicalModules={(clinicalModules ?? []).map((m: any) => ({ id: m.id as string, module_type: m.module_type as string }))}
                />
              </div>
            </div>

            {/* Progress ring — desktop */}
            {userId && (
              <div className="hero-ring" style={{ flexShrink:0, flexDirection:'column', alignItems:'center', width:140, height:140, position:'relative', animation:'floaty 6s ease-in-out 1.4s infinite' }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <defs>
                    <linearGradient id="pgGrad3" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#3B79FF"/><stop offset="1" stopColor="#2456D6"/>
                    </linearGradient>
                  </defs>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#E1E9FA" strokeWidth="13" pathLength="100" strokeDasharray="2.3 2.7" transform="rotate(-90 70 70)"/>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="url(#pgGrad3)" strokeWidth="17" pathLength="100"
                    strokeDasharray={`${progressPercent} ${100-progressPercent}`}
                    transform="rotate(-90 70 70)"
                    style={{ transition:'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1) .4s' }}/>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'countUp .6s ease .8s backwards' }}>
                  <div style={{ fontSize:24, fontWeight:800, color:'#2456D6', letterSpacing:'-.03em', lineHeight:1 }}>
                    {progressPercent}<span style={{ fontSize:13, color:'#8DA5DC' }}>%</span>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9AA6BE', marginTop:4 }}>
                    {Math.floor(totalStars/3)} of {totalLectures}
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar — mobile */}
            {userId && (
              <div className="hero-pbar" style={{ marginTop:16, width:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#8892A8' }}>Overall Progress</span>
                  <span style={{ fontSize:20, fontWeight:800, color:'#2456D6', letterSpacing:'-.02em' }}>{progressPercent}%</span>
                </div>
                <div style={{ height:8, borderRadius:999, background:'#E1E9FA', overflow:'hidden' }}>
                  <div className="shimmer-blue" style={{ height:'100%', width:`${progressPercent}%`, borderRadius:999 }}/>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#8892A8', marginTop:6 }}>{Math.floor(totalStars/3)} of {totalLectures} lectures mastered</div>
              </div>
            )}
          </div>
        </section>

        {/* ── Continue Learning ── */}
        {userId && lastAccessedLecture && (
          <div className="cont-card" style={{ background:'linear-gradient(120deg,rgba(37,99,235,.07),#fff 62%)', border:'1px solid #E2E8F0', borderRadius:18, overflow:'hidden', marginBottom:26, boxShadow:'rgba(15,23,42,0.04) 0px 1px 3px,rgba(15,23,42,0.22) 0px 12px 26px -18px', animation:'fadeUp .55s ease .3s backwards' }}>
            <div className="cont-inner" style={{ display:'flex', alignItems:'center', gap:16 }}>
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
            <div style={{ height:4, background:'rgba(37,99,235,.12)' }}>
              <div className="shimmer-blue" style={{ height:'100%', width:`${progressPercent}%` }}/>
            </div>
          </div>
        )}

        {/* ── Chapters / Sub-Subjects (full width) ── */}
        <SubjectChaptersClient
          uniSlug={uniSlug}
          subjectSlug={subjectSlug}
          groupLabel={groupLabel}
          groups={groupItems}
          initialStarsByLecture={starsByLecture}
          lastLectureId={lastLectureId}
          userId={userId}
        />
      </main>
    </div>
  )
}