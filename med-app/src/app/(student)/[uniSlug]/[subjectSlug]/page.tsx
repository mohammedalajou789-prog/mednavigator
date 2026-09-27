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

const STAR_POINTS = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'
const STAR_COLOR  = ['#CBD5E1', '#EF4444', '#E5A700', '#17A66B']
const STAR_LABEL  = ['Not rated', 'Need review', 'Almost there', 'Mastered']
const pad = (n: number) => String(n).padStart(2, '0')

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
  const progressPercent = totalLectures > 0 ? Math.min(100, Math.round((totalStars / (totalLectures * 3)) * 100)) : 0
  const masteredCount   = lectures.filter((l: any) => (starsByLecture[l.id] ?? 0) === 3).length

  const lastAccessedLecture = lastLectureId
    ? lectures.find((l: any) => l.id === lastLectureId) ?? null
    : null

  // Where the last lecture lives: "<Chapter> · Lecture 03"
  let lastLecWhere = 'Pick up where you left off'
  if (lastLectureId) {
    const g = groupItems.find(gr => gr.lectures.some(l => l.id === lastLectureId))
    if (g) lastLecWhere = `${g.title} · Lecture ${pad(g.lectures.findIndex(l => l.id === lastLectureId) + 1)}`
  }

  const lastLecStars = lastLectureId ? Math.max(0, Math.min(3, starsByLecture[lastLectureId] ?? 0)) : 0
  const lastLecLabel = STAR_LABEL[lastLecStars]

  const typeBadge  = subRow.subject_type === 'system' ? 'System' : subRow.subject_type === 'standard' ? 'Standard' : 'Clinical'
  const accBadge   = subRow.access_mode  === 'free'   ? 'Free'   : subRow.access_mode  === 'mixed'    ? 'Mixed'    : 'Premium'
  const groupLabel = isSystem ? 'Sub-Subject' : 'Chapter'

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FC', color:'#3C4661', fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif' }}>
      <BfCacheReloader />
      <style>{`
        @keyframes spFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spBarIn   { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes spShimmer { 0%{background-position:-160% 0} 55%,100%{background-position:260% 0} }
        @keyframes spGlow    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-26px,14px) scale(1.12)} }
        @keyframes spPulse   { 0%{transform:scale(1);opacity:.5} 70%,100%{transform:scale(1.9);opacity:0} }
        @keyframes spCount   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        /* Shared progress fills (also used by SubjectChaptersClient) */
        .sp-shimmer {
          background:linear-gradient(100deg,#3B79FF 0%,#3B79FF 38%,#A9C4FF 50%,#2456D6 62%,#2456D6 100%);
          background-size:260% 100%; transform-origin:left;
          animation:spBarIn 1s cubic-bezier(.4,0,.2,1) .5s backwards, spShimmer 3.6s ease-in-out 1.6s infinite;
        }
        .sp-shimmer-green {
          background:linear-gradient(100deg,#17A66B 0%,#17A66B 38%,#7EE2B3 50%,#108051 62%,#108051 100%);
          background-size:260% 100%; transform-origin:left;
          animation:spBarIn 1s cubic-bezier(.4,0,.2,1) .5s backwards, spShimmer 3.6s ease-in-out 1.8s infinite;
        }

        .sp-main { max-width:1320px; margin:0 auto; padding:8px 16px 64px; }

        /* Breadcrumb: back link on phone, full trail from tablet up */
        .sp-back  { display:flex; align-items:center; gap:2px; margin:0 0 8px -10px; animation:spSlideIn .45s ease backwards; }
        .sp-back a { width:44px; height:44px; display:flex; align-items:center; justify-content:center; color:#15203A; border-radius:12px; }
        .sp-crumbs { display:none; }

        /* Hero — same blue as the original */
        .sp-hero { position:relative; overflow:hidden; border-radius:22px; padding:20px; margin-bottom:16px;
          background:linear-gradient(120deg,#EDF3FF 0%,#F3F7FF 52%,#FCFDFF 100%); border:1px solid #E2EAFB;
          box-shadow:rgba(16,24,40,0.04) 0px 1px 2px, rgba(40,90,200,0.5) 0px 24px 50px -34px; animation:spFadeUp .55s ease .04s backwards; }
        .sp-glow-a { position:absolute; top:-90px; right:-40px; width:300px; height:220px; pointer-events:none; filter:blur(34px);
          background:radial-gradient(rgba(147,197,253,.4) 0%,rgba(196,181,253,.16) 55%,transparent 75%); animation:spGlow 11s ease-in-out infinite; }
        .sp-glow-b { position:absolute; bottom:-120px; left:-60px; width:300px; height:240px; pointer-events:none; filter:blur(40px);
          background:radial-gradient(rgba(129,224,193,.28) 0%,transparent 70%); animation:spGlow 14s ease-in-out 2s infinite; }
        .sp-hero-grid { position:relative; display:grid; grid-template-columns:minmax(0,1fr); gap:16px; }
        .sp-hero-text { display:flex; flex-direction:column; gap:12px; min-width:0; }
        .sp-badges { display:flex; gap:8px; flex-wrap:wrap; }
        .sp-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:999px; font-size:11.5px; font-weight:700; }
        .sp-title { margin:0; font-size:clamp(26px,6.4vw,46px); line-height:1.08; font-weight:800; letter-spacing:-.03em; color:#15203A; }
        .sp-desc  { margin:0; max-width:580px; font-size:14px; line-height:1.6; color:#55617D; }
        .sp-ring  { display:none; }
        .sp-pbar  { display:block; }
        .sp-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        .sp-actions .sp-more-btn { grid-column:1 / -1; }
        .sp-pill { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,.75); border:1px solid #E2EAFB; border-radius:14px;
          padding:10px 12px; transition:transform .2s ease,box-shadow .2s ease; }
        .sp-pill-icon { width:32px; height:32px; border-radius:9px; background:#fff; border:1px solid #E2EAFB; color:#2F6BFF;
          display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sp-pill-num { font-size:16px; font-weight:800; line-height:1; color:#15203A; }
        .sp-pill-lbl { font-size:11.5px; font-weight:600; color:#6B7690; margin-top:3px; }

        /* Continue learning — phone: 2 rows · tablet+: 1 row */
        .sp-cont { border-radius:18px; overflow:hidden; margin-bottom:24px; background:linear-gradient(120deg,rgba(37,99,235,.07),#fff 62%);
          border:1px solid #E2E8F0; box-shadow:rgba(15,23,42,0.04) 0px 1px 3px, rgba(15,23,42,0.22) 0px 12px 26px -18px;
          transition:transform .22s ease,box-shadow .22s ease; animation:spFadeUp .55s ease .3s backwards; }
        .sp-cont-in { display:grid; grid-template-columns:44px minmax(0,1fr) auto; grid-template-areas:"icon text text" "stars stars btn";
          gap:14px 12px; align-items:center; padding:16px; }
        .sp-cont-icon { grid-area:icon; position:relative; width:44px; height:44px; }
        .sp-cont-text { grid-area:text; min-width:0; }
        .sp-cont-title { font-size:15.5px; font-weight:700; line-height:1.3; letter-spacing:-.01em; color:#15203A; }
        .sp-cont-stars { grid-area:stars; display:flex; align-items:center; gap:8px; }
        .sp-resume { grid-area:btn; display:inline-flex; align-items:center; justify-content:center; gap:8px; height:44px; padding:0 18px;
          border-radius:12px; background:#2563EB; color:#fff; font-size:14px; font-weight:700; text-decoration:none;
          transition:transform .2s ease,box-shadow .2s ease,background .2s ease; }
        .sp-resume:focus-visible, .sp-back a:focus-visible, .sp-crumbs a:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }

        @media (min-width:640px) {
          .sp-main  { padding:clamp(20px,3vw,32px) clamp(20px,3vw,40px) 72px; }
          .sp-back  { display:none; }
          .sp-crumbs { display:flex; align-items:center; gap:9px; flex-wrap:wrap; font-size:13px; font-weight:600; margin-bottom:18px;
            animation:spSlideIn .45s ease backwards; }
          .sp-hero { padding:28px; border-radius:24px; margin-bottom:20px; }
          .sp-hero-grid { grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"text ring" "actions actions"; column-gap:28px; row-gap:20px; }
          .sp-hero-grid.is-guest { grid-template-columns:minmax(0,1fr); grid-template-areas:"text" "actions"; }
          .sp-hero-text { grid-area:text; }
          .sp-ring { grid-area:ring; display:flex; flex-direction:column; align-items:center; gap:8px; }
          .sp-pbar { display:none; }
          .sp-actions { grid-area:actions; grid-template-columns:auto auto minmax(0,1fr); gap:10px; }
          .sp-actions .sp-more-btn { grid-column:auto; }
          .sp-pill { padding:10px 16px 10px 12px; }
          .sp-pill-icon { width:34px; height:34px; border-radius:10px; }
          .sp-pill-num { font-size:17px; }
          .sp-pill-lbl { font-size:12px; }
          .sp-badge { padding:5px 12px; font-size:12px; }
          .sp-desc { font-size:14.5px; }
          .sp-cont-in { grid-template-columns:46px minmax(0,1fr) auto auto; grid-template-areas:"icon text stars btn"; gap:16px; padding:18px 20px; }
          .sp-cont-icon { width:46px; height:46px; }
          .sp-cont-title { font-size:17px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .sp-cont-stars { flex-direction:column; align-items:flex-end; gap:4px; }
          .sp-resume { height:46px; padding:0 20px; }
        }
        @media (min-width:1024px) {
          .sp-hero { padding:34px 44px 34px 40px; }
          .sp-hero-grid { grid-template-areas:"text ring" "actions ring"; column-gap:48px; row-gap:22px; align-items:center; }
          .sp-actions { display:flex; flex-wrap:wrap; gap:12px; }
          .sp-desc { font-size:15px; }
        }

        @media (hover:hover) {
          .sp-pill:hover { transform:translateY(-2px); box-shadow:0 12px 22px -16px rgba(40,90,200,.6); }
          .sp-cont:hover { transform:translateY(-3px); box-shadow:0 22px 38px -22px rgba(37,99,235,.5); }
          .sp-resume:hover { transform:translateX(3px); background:#1D4ED8; box-shadow:0 12px 22px -12px rgba(37,99,235,.9); }
          .sp-crumbs a:hover { color:#2563EB !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sp-hero, .sp-cont, .sp-crumbs, .sp-back, .sp-glow-a, .sp-glow-b, .sp-shimmer, .sp-shimmer-green { animation:none !important; }
          .sp-pill, .sp-cont, .sp-resume { transition:none; }
        }
      `}</style>

      <main className="sp-main">

        {/* ── Breadcrumb ── */}
        <nav className="sp-back" aria-label="Back">
          <Link prefetch={false} href={`/${uniSlug}`} aria-label={`Back to ${uniRow.name}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <span style={{ fontSize:13, fontWeight:600, color:'#6B7690' }}>{uniRow.name}</span>
        </nav>
        <nav className="sp-crumbs" aria-label="Breadcrumb">
          <Link prefetch={false} href="/home" style={{ color:'#6B7690', textDecoration:'none' }}>Home</Link>
          <span style={{ color:'#C2CADB' }}>/</span>
          <Link prefetch={false} href={`/${uniSlug}`} style={{ color:'#6B7690', textDecoration:'none' }}>{uniRow.name}</Link>
          <span style={{ color:'#C2CADB' }}>/</span>
          <span style={{ color:'#15203A' }}>{subRow.name}</span>
        </nav>

        {/* ── Hero ── */}
        <section className="sp-hero">
          <div className="sp-glow-a" aria-hidden="true"/>
          <div className="sp-glow-b" aria-hidden="true"/>

          <div className={`sp-hero-grid${userId ? '' : ' is-guest'}`}>
            <div className="sp-hero-text">
              <div className="sp-badges">
                <span className="sp-badge" style={{ background:'#E7F7EF', border:'1px solid #C7EBD8', color:'#138A5A' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#17A66B' }}/>
                  {typeBadge}
                </span>
                <span className="sp-badge" style={{ background:'#FFF6E0', border:'1px solid #F3E1AE', color:'#A1730A' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1"><polygon points={STAR_POINTS}/></svg>
                  {accBadge}
                </span>
              </div>
              <h1 className="sp-title">{subRow.name}</h1>
              {subRow.description && <p className="sp-desc">{subRow.description}</p>}
            </div>

            {/* Progress ring — tablet & desktop */}
            {userId && (
              <div className="sp-ring">
                <div style={{ position:'relative', width:140, height:140 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
                    <defs>
                      <linearGradient id="spPgGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#3B79FF"/><stop offset="1" stopColor="#2456D6"/>
                      </linearGradient>
                    </defs>
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#E1E9FA" strokeWidth="13" pathLength="100" strokeDasharray="2.3 2.7" transform="rotate(-90 70 70)"/>
                    <circle cx="70" cy="70" r="55" fill="none" stroke="url(#spPgGrad)" strokeWidth="17" pathLength="100"
                      strokeDasharray={`${progressPercent} ${100 - progressPercent}`}
                      transform="rotate(-90 70 70)"
                      style={{ transition:'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1) .4s' }}/>
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'spCount .6s ease .8s backwards' }}>
                    <div style={{ fontSize:26, fontWeight:800, color:'#2456D6', letterSpacing:'-.03em', lineHeight:1 }}>
                      {progressPercent}<span style={{ fontSize:13, color:'#8DA5DC' }}>%</span>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#6B7690', marginTop:4 }}>Overall</div>
                  </div>
                </div>
                <span style={{ fontSize:12.5, fontWeight:700, color:'#55617D' }}>{masteredCount} of {totalLectures} mastered</span>
              </div>
            )}

            {/* Progress bar — phone */}
            {userId && (
              <div className="sp-pbar">
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#55617D' }}>Overall progress</span>
                  <span style={{ fontSize:20, fontWeight:800, color:'#2456D6', letterSpacing:'-.02em' }}>{progressPercent}%</span>
                </div>
                <div style={{ height:8, borderRadius:999, background:'#E1E9FA', overflow:'hidden' }}>
                  <div className="sp-shimmer" style={{ height:'100%', width:`${progressPercent}%`, borderRadius:999 }}/>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#55617D', marginTop:6 }}>{masteredCount} of {totalLectures} lectures mastered</div>
              </div>
            )}

            {/* Stats + More */}
            <div className="sp-actions">
              <div className="sp-pill">
                <span className="sp-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </span>
                <div>
                  <div className="sp-pill-num">{totalLectures}</div>
                  <div className="sp-pill-lbl">Lectures</div>
                </div>
              </div>
              <div className="sp-pill">
                <span className="sp-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                </span>
                <div>
                  <div className="sp-pill-num">{groupItems.length}</div>
                  <div className="sp-pill-lbl">{groupLabel}s</div>
                </div>
              </div>
              <MoreInSubjectButton
                uniSlug={uniSlug}
                subjectSlug={subjectSlug}
                subjectName={subRow.name}
                pyqCount={totalPyq}
                quizCount={totalQuiz}
                flashCount={totalFlash}
                videos={(videos ?? []).map((v: any) => ({ id: v.id as string, title: v.title as string, isPreview: !!v.is_preview }))}
                clinicalModules={(clinicalModules ?? []).map((m: any) => ({ id: m.id as string, module_type: m.module_type as string }))}
              />
            </div>
          </div>
        </section>

        {/* ── Continue Learning ── */}
        {userId && lastAccessedLecture && (
          <section className="sp-cont" aria-label="Continue learning">
            <div className="sp-cont-in">
              <div className="sp-cont-icon">
                <span style={{ position:'absolute', inset:0, borderRadius:14, background:'rgba(37,99,235,.45)', animation:'spPulse 2.6s ease-out 1.4s infinite' }}/>
                <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:14, background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 16px rgba(37,99,235,.4)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="7 4 20 12 7 20 7 4"/></svg>
                </div>
              </div>

              <div className="sp-cont-text">
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', color:'#2563EB', marginBottom:3 }}>CONTINUE LEARNING</div>
                <div className="sp-cont-title">{(lastAccessedLecture as any).title}</div>
                <div style={{ fontSize:12.5, fontWeight:600, color:'#6B7690', marginTop:3 }}>{lastLecWhere}</div>
              </div>

              <div className="sp-cont-stars">
                <div style={{ display:'flex', gap:3 }} aria-label={`${lastLecStars} of 3 stars`}>
                  {[1, 2, 3].map(i => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                      fill={i <= lastLecStars ? STAR_COLOR[lastLecStars] : 'none'}
                      stroke={i <= lastLecStars ? STAR_COLOR[lastLecStars] : '#CBD5E1'}
                      strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                      <polygon points={STAR_POINTS}/>
                    </svg>
                  ))}
                </div>
                <div style={{ fontSize:11.5, color:'#6B7690', fontWeight:700 }}>{lastLecLabel}</div>
              </div>

              <Link prefetch={false} className="sp-resume"
                href={`/${uniSlug}/${subjectSlug}/${(lastAccessedLecture as any).slug ?? (lastAccessedLecture as any).id}`}>
                <span>Resume</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
            <div style={{ height:4, background:'rgba(37,99,235,.12)' }}>
              <div className="sp-shimmer" style={{ height:'100%', width:`${progressPercent}%` }}/>
            </div>
          </section>
        )}

        {/* ── Chapters / Sub-Subjects (title cards → popup with lectures) ── */}
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