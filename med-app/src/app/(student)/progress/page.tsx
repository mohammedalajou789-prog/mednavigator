import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProgressPage() {
  const supabase = await createServerClient()
  const profile  = await requireAuth()

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const [
    { data: checklistData },
    { count: bookmarksCount },
  ] = await Promise.all([
    supabase
      .from('checklist_progress')
      .select(`
        lecture_id,
        stars,
        updated_at,
        lectures (
          id,
          title,
          subject_id,
          subjects (
            id,
            name,
            university_id,
            universities ( id, name, slug )
          )
        )
      `)
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false }),

    supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ])

  // ── Subject IDs → fetch total lectures ───────────────────────────────────
  const subjectIdsSet = new Set<string>()
  checklistData?.forEach(row => {
    const lec = row.lectures as any
    if (lec?.subject_id) subjectIdsSet.add(lec.subject_id)
  })
  const subjectIds = Array.from(subjectIdsSet)
  let totalLecturesBySubject: Record<string, number> = {}
  if (subjectIds.length > 0) {
    const { data: lecs } = await supabase
      .from('lectures')
      .select('id, subject_id')
      .in('subject_id', subjectIds)
      .eq('status', 'published')
    lecs?.forEach((l: any) => {
      totalLecturesBySubject[l.subject_id] = (totalLecturesBySubject[l.subject_id] ?? 0) + 1
    })
  }

  // ── Build subject map ─────────────────────────────────────────────────────
  type LectureEntry = { id: string; title: string; stars: number; lastUpdated: string | null }
  const subjectMap: Record<string, {
    id: string; name: string; universityName: string; universitySlug: string
    totalLectures: number; lectures: LectureEntry[]
  }> = {}

  checklistData?.forEach(row => {
    const lec = row.lectures as any
    if (!lec) return
    const sub = lec.subjects as any
    if (!sub) return
    const uni = sub.universities as any
    if (!subjectMap[sub.id]) {
      subjectMap[sub.id] = {
        id: sub.id, name: sub.name,
        universityName: uni?.name ?? '', universitySlug: uni?.slug ?? '',
        totalLectures: totalLecturesBySubject[sub.id] ?? 0, lectures: [],
      }
    }
    if (!subjectMap[sub.id].lectures.find(l => l.id === lec.id)) {
      subjectMap[sub.id].lectures.push({ id: lec.id, title: lec.title, stars: row.stars ?? 0, lastUpdated: row.updated_at })
    }
  })

  const subjects = Object.values(subjectMap)

  // ── KPI ───────────────────────────────────────────────────────────────────
  const totalStarsAll    = subjects.reduce((s, sub) => s + sub.lectures.reduce((a, l) => a + l.stars, 0), 0)
  const totalLecturesAll = subjects.reduce((s, sub) => s + sub.totalLectures, 0)
  const masteredCount    = subjects.reduce((s, sub) => s + sub.lectures.filter(l => l.stars === 3).length, 0)
  const overallPercent   = totalLecturesAll > 0 ? Math.round((totalStarsAll / (totalLecturesAll * 3)) * 100) : 0
  const remainingCount   = totalLecturesAll - masteredCount

  // ── Mastery distribution ──────────────────────────────────────────────────
  const masteredN     = subjects.reduce((s, sub) => s + sub.lectures.filter(l => l.stars === 3).length, 0)
  const almostN       = subjects.reduce((s, sub) => s + sub.lectures.filter(l => l.stars === 2).length, 0)
  const needReviewN   = subjects.reduce((s, sub) => s + sub.lectures.filter(l => l.stars === 1).length, 0)
  const ratedTotal    = masteredN + almostN + needReviewN
  const circumference = 2 * Math.PI * 52 // r=52 → ~327
  const C = circumference

  // donut segments (stroke-dasharray = [filled, gap])
  const seg = (n: number) => ratedTotal > 0 ? (n / ratedTotal) * C : 0
  const masteredSeg   = seg(masteredN)
  const almostSeg     = seg(almostN)
  const reviewSeg     = seg(needReviewN)

  // ── Weekly activity (last 7 days) ─────────────────────────────────────────
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today = new Date()
  const weekActivity: number[] = Array(7).fill(0)
  checklistData?.forEach(row => {
    if (!row.updated_at) return
    const d    = new Date(row.updated_at)
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
    if (diff < 7) {
      const dayIdx = d.getDay() // 0=Sun
      weekActivity[dayIdx]++
    }
  })
  const maxActivity = Math.max(...weekActivity, 1)
  // Reorder to start from 7 days ago
  const orderedDays: { label: string; count: number; isToday: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const dayIdx = (today.getDay() - i + 7) % 7
    orderedDays.push({ label: days[dayIdx], count: weekActivity[dayIdx], isToday: i === 0 })
  }
  const bestDay = orderedDays.reduce((best, d) => d.count > best.count ? d : best, orderedDays[0])

  // ── Monthly progress (last 3 months) ─────────────────────────────────────
  const now = new Date()
  const months = [2, 1, 0].map(mAgo => {
    const d   = new Date(now.getFullYear(), now.getMonth() - mAgo, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - mAgo + 1, 0)
    const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    const rated = (checklistData ?? []).filter(r => {
      if (!r.updated_at) return false
      const rd = new Date(r.updated_at)
      return rd >= d && rd <= end
    }).length
    return { label, rated, isCurrent: mAgo === 0 }
  })

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentActivity = (checklistData ?? []).slice(0, 5)

  function formatDate(d: string | null) {
    if (!d) return ''
    const dt  = new Date(d)
    const diff = Math.floor((Date.now() - dt.getTime()) / 1000)
    if (diff < 60)    return 'Just now'
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    if (diff < 604800)return `${Math.floor(diff/86400)}d ago`
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const STAR_LABELS: Record<number,string> = { 0:'Not Started', 1:'Need Review', 2:'Almost There', 3:'Mastered' }
  const STAR_STYLE: Record<number,{bg:string;color:string}> = {
    0:{bg:'#F1F5F9',color:'#94A3B8'}, 1:{bg:'#FEF2F2',color:'#EF4444'},
    2:{bg:'#FFFBEB',color:'#F59E0B'}, 3:{bg:'#F0FDF4',color:'#22C55E'},
  }

  // ── Progress ring SVG helper ──────────────────────────────────────────────
  // pathLength trick: set pathLength="100" then dasharray is just percent
  const ringR  = 40
  const ringC  = 2 * Math.PI * ringR // ~251

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes barIn   { from{transform:scaleX(0)}to{transform:scaleX(1)} }
        @keyframes barUp   { from{transform:scaleY(0)}to{transform:scaleY(1)} }
        @keyframes ringIn  { from{stroke-dashoffset:327}to{stroke-dashoffset:0} }
        @keyframes drawRing{ from{stroke-dasharray:0 251}to{} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes floaty  { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
        .prog-card { transition:transform .22s ease,box-shadow .22s ease; }
        .prog-card:hover { transform:translateY(-3px); box-shadow:0 18px 34px -18px rgba(15,23,42,.25) !important; }
        .lec-row { transition:background .2s ease,transform .2s ease; }
        .lec-row:hover { background:#E8EEF7 !important; transform:translateX(3px); }
        .shimmer-bar {
          background: linear-gradient(100deg,#3B82F6 0%,#2563EB 42%,#93B4FF 52%,#2563EB 62%,#2563EB 100%);
          background-size: 260% 100%;
          animation: barIn 1s cubic-bezier(.4,0,.2,1) .4s backwards, shimmer 3.4s ease-in-out 1.4s infinite;
        }
        .shimmer-bar-green {
          background: linear-gradient(100deg,#16A34A 0%,#16A34A 42%,#6EE7A8 52%,#16A34A 62%,#16A34A 100%);
          background-size: 260% 100%;
          animation: barIn 1s cubic-bezier(.4,0,.2,1) .4s backwards, shimmer 3.4s ease-in-out 1.4s infinite;
        }
      `}</style>

      <main style={{ padding:'clamp(16px,4vw,28px) clamp(16px,4vw,28px) 64px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:24, animation:'fadeUp .5s ease backwards' }}>
          <div>
            <h1 style={{ fontSize:'clamp(22px,5vw,28px)', fontWeight:800, letterSpacing:'-.025em', margin:0 }}>My Progress</h1>
            <p style={{ fontSize:14, color:'#475569', marginTop:4, marginBottom:0 }}>Track your learning across all subjects</p>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'9px 14px', boxShadow:'0 4px 14px -10px rgba(15,23,42,.2)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
            </svg>
            <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>Last 3 months</span>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, marginBottom:20 }}>

          {/* Overall Progress — ring */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', display:'flex', alignItems:'center', gap:18, animation:'fadeUp .5s ease .04s backwards' }}>
            <div style={{ position:'relative', width:104, height:104, flexShrink:0, animation:'floaty 5s ease-in-out 1.6s infinite' }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                {/* track */}
                <circle cx="52" cy="52" r="40" fill="none" stroke="#E9EEF7" strokeWidth="12" pathLength="100" strokeDasharray="2.4 2.6" transform="rotate(-90 52 52)" />
                {/* fill */}
                <circle cx="52" cy="52" r="40" fill="none" stroke="#2563EB" strokeWidth="16" pathLength="100"
                  strokeDasharray={`${overallPercent} ${100 - overallPercent}`}
                  transform="rotate(-90 52 52)"
                  style={{ transition:'stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:22, fontWeight:800, letterSpacing:'-.03em', lineHeight:1 }}>
                  {overallPercent}<span style={{ fontSize:12, fontWeight:700, color:'#94A3B8' }}>%</span>
                </span>
                <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', color:'#B4BECE', textTransform:'uppercase', marginTop:4 }}>complete</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:'#0F172A', margin:0 }}>Overall Progress</p>
              <p style={{ fontSize:11.5, color:'#94A3B8', marginTop:3 }}>across all lectures</p>
              {overallPercent > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:700, color:'#16A34A', background:'#F0FDF4', padding:'4px 9px', borderRadius:99, marginTop:10 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 15 12 9 18 15"/></svg>
                  Keep it up!
                </span>
              )}
            </div>
          </div>

          {/* Mastered — orange ring */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', display:'flex', alignItems:'center', gap:18, animation:'fadeUp .5s ease .08s backwards' }}>
            <div style={{ position:'relative', width:104, height:104, flexShrink:0, animation:'floaty 5s ease-in-out 2s infinite' }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <defs>
                  <linearGradient id="mastGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FB7185" /><stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <circle cx="52" cy="52" r="40" fill="none" stroke="#FBEDEF" strokeWidth="12" pathLength="100" strokeDasharray="2.4 2.6" transform="rotate(-90 52 52)" />
                <circle cx="52" cy="52" r="40" fill="none" stroke="url(#mastGrad)" strokeWidth="16" pathLength="100"
                  strokeDasharray={`${totalLecturesAll > 0 ? Math.round((masteredCount/totalLecturesAll)*100) : 0} 100`}
                  transform="rotate(-90 52 52)"
                  style={{ transition:'stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1) .1s' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:22, fontWeight:800, letterSpacing:'-.03em', lineHeight:1 }}>
                  {masteredCount}<span style={{ fontSize:12, fontWeight:700, color:'#94A3B8' }}>/{totalLecturesAll}</span>
                </span>
                <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', color:'#C8B3AE', textTransform:'uppercase', marginTop:4 }}>mastered</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:'#0F172A', margin:0 }}>Mastered</p>
              <p style={{ fontSize:11.5, color:'#94A3B8', marginTop:3 }}>of {totalLecturesAll} lectures</p>
              {remainingCount > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:700, color:'#EA580C', background:'#FFF7ED', padding:'4px 9px', borderRadius:99, marginTop:10 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
                  {remainingCount} left to go
                </span>
              )}
            </div>
          </div>

          {/* Active Subjects */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', animation:'fadeUp .5s ease .12s backwards' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'#F5F3FF', color:'#7C3AED', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:34 }}>
                {[40,65,50,100].map((h,i) => (
                  <div key={i} style={{ width:7, height:`${h}%`, borderRadius:3, background:h===100?'#7C3AED':i===3?'#C4B5FD':i===1?'#DDD6FE':'#EDE9FE' }}/>
                ))}
              </div>
            </div>
            <p style={{ fontSize:26, fontWeight:800, lineHeight:1, marginTop:14 }}>{subjects.length}</p>
            <p style={{ fontSize:13, fontWeight:600, color:'#475569', marginTop:4 }}>Active Subjects</p>
            <p style={{ fontSize:11.5, color:'#94A3B8', marginTop:2 }}>being studied</p>
          </div>

          {/* Bookmarks */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', animation:'fadeUp .5s ease .16s backwards' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'#FFFBEB', color:'#D97706', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'#D97706', background:'#FFFBEB', padding:'4px 9px', borderRadius:99 }}>saved items</span>
            </div>
            <p style={{ fontSize:26, fontWeight:800, lineHeight:1, marginTop:14 }}>{bookmarksCount ?? 0}</p>
            <p style={{ fontSize:13, fontWeight:600, color:'#475569', marginTop:4 }}>Bookmarks</p>
            <p style={{ fontSize:11.5, color:'#94A3B8', marginTop:2 }}>across all subjects</p>
          </div>
        </div>

        {/* ── Progress by Subject ── */}
        <h2 style={{ fontSize:16, fontWeight:700, letterSpacing:'-.01em', marginBottom:12, animation:'fadeUp .5s ease .24s backwards' }}>Progress by Subject</h2>

        {subjects.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:18, border:'1px solid #E2E8F0', padding:'48px 24px', textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
            <p style={{ fontSize:15, fontWeight:600, color:'#475569', margin:'0 0 8px' }}>No progress yet</p>
            <p style={{ fontSize:13, color:'#94A3B8', margin:'0 0 20px' }}>Rate lectures with stars to track your progress</p>
            <Link href="/home" prefetch={false} style={{ padding:'10px 24px', background:'#2563EB', color:'#fff', borderRadius:10, fontSize:13, fontWeight:600, textDecoration:'none' }}>Browse Subjects</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
            {subjects.map((subject, si) => {
              const subStars   = subject.lectures.reduce((s,l) => s + l.stars, 0)
              const subPercent = subject.totalLectures > 0 ? Math.round((subStars / (subject.totalLectures * 3)) * 100) : 0
              const masteredIn = subject.lectures.filter(l => l.stars === 3).length
              const isComplete = subPercent === 100
              return (
                <div key={subject.id} className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', animation:'fadeUp .5s ease backwards', animationDelay:`${0.28 + si*0.04}s` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
                    <div>
                      <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#0F172A' }}>{subject.name}</p>
                      <p style={{ margin:'3px 0 0', fontSize:12, color:'#94A3B8' }}>{subject.universityName}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ margin:0, fontSize:22, fontWeight:800, color:isComplete?'#16A34A':'#2563EB', lineHeight:1 }}>{subPercent}%</p>
                      <p style={{ margin:'4px 0 0', fontSize:11, color:'#94A3B8' }}>{masteredIn}/{subject.totalLectures} mastered</p>
                    </div>
                  </div>

                  {/* Progress bar with shimmer */}
                  <div style={{ height:6, background:'#F1F5F9', borderRadius:999, overflow:'hidden', marginBottom:14 }}>
                    <div className={isComplete ? 'shimmer-bar-green' : 'shimmer-bar'} style={{ height:'100%', width:`${subPercent}%`, borderRadius:999, transformOrigin:'left' }} />
                  </div>

                  {/* Lecture rows */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {subject.lectures.slice(0, 5).map((lec, li) => {
                      const st = STAR_STYLE[lec.stars]
                      return (
                        <div key={lec.id} className="lec-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:'#F1F5F9', animation:'slideIn .45s ease backwards', animationDelay:`${0.45 + li*0.07}s` }}>
                          <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                            {[1,2,3].map(i => (
                              <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                                fill={i <= lec.stars ? (i===1?'#EF4444':i===2?'#F59E0B':'#22C55E') : 'none'}
                                stroke={i <= lec.stars ? (i===1?'#EF4444':i===2?'#F59E0B':'#22C55E') : '#CBD5E1'}
                                strokeWidth="1.5">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            ))}
                          </div>
                          <span style={{ flex:1, minWidth:0, fontSize:13, fontWeight:500, color:'#475569', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lec.title}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:st.bg, color:st.color, flexShrink:0 }}>{STAR_LABELS[lec.stars]}</span>
                        </div>
                      )
                    })}
                    {subject.totalLectures > subject.lectures.length && (
                      <p style={{ margin:'4px 0 0', fontSize:12, color:'#94A3B8', textAlign:'center' }}>
                        +{subject.totalLectures - subject.lectures.length} more lectures not yet started
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bottom Grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap:18, alignItems:'start' }}>

          {/* Mastery Distribution donut */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', animation:'fadeUp .5s ease .36s backwards' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#A0A8B8', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:16, margin:'0 0 16px' }}>Mastery Distribution</p>
            <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
              <svg width="132" height="132" viewBox="0 0 132 132" style={{ flexShrink:0 }}>
                {/* track */}
                <circle cx="66" cy="66" r="52" fill="none" stroke="#F1F5F9" strokeWidth="16"/>
                {/* mastered */}
                <circle cx="66" cy="66" r="52" fill="none" stroke="#22C55E" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${masteredSeg} ${C - masteredSeg}`}
                  transform="rotate(-90 66 66)"
                  style={{ transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1) .5s' }}/>
                {/* almost */}
                <circle cx="66" cy="66" r="52" fill="none" stroke="#F59E0B" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${almostSeg} ${C - almostSeg}`}
                  strokeDashoffset={-masteredSeg}
                  transform="rotate(-90 66 66)"/>
                {/* need review */}
                <circle cx="66" cy="66" r="52" fill="none" stroke="#EF4444" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={`${reviewSeg} ${C - reviewSeg}`}
                  strokeDashoffset={-(masteredSeg + almostSeg)}
                  transform="rotate(-90 66 66)"/>
                <text x="66" y="63" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="26" fontWeight="800" fill="#0F172A">{ratedTotal}</text>
                <text x="66" y="80" textAnchor="middle" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" fill="#94A3B8">lectures</text>
              </svg>
              <div style={{ flex:1, minWidth:150, display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { color:'#22C55E', label:'Mastered',      n:masteredN   },
                  { color:'#F59E0B', label:'Almost there',  n:almostN     },
                  { color:'#EF4444', label:'Need review',   n:needReviewN },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10, animation:'slideIn .45s ease backwards' }}>
                    <span style={{ width:9, height:9, borderRadius:'50%', background:row.color, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#475569' }}>{row.label}</span>
                    <span style={{ fontSize:13, fontWeight:800 }}>{row.n}</span>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:9, height:9, borderRadius:'50%', background:'#E2E8F0', flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#94A3B8' }}>Not started</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#94A3B8' }}>{totalLecturesAll - ratedTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Study Activity bar chart */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', animation:'fadeUp .5s ease .40s backwards' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#A0A8B8', letterSpacing:'.06em', textTransform:'uppercase', margin:'0 0 16px' }}>Study Activity</p>
            <div style={{ display:'flex', gap:'clamp(6px,2vw,14px)', height:130 }}>
              {orderedDays.map((day, i) => {
                const heightPct = Math.round((day.count / maxActivity) * 100) || (day.isToday ? 8 : 5)
                const isHighest = day.count === Math.max(...orderedDays.map(d => d.count)) && day.count > 0
                return (
                  <div key={i} style={{ flex:1, height:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, width:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                      <div style={{
                        width:'100%', maxWidth:26, height:`${heightPct}%`,
                        borderRadius:'8px 8px 4px 4px',
                        background: isHighest ? '#2563EB' : day.count > 0 ? '#93B4FF' : '#EEF2F7',
                        transformOrigin:'bottom',
                        animation:`barUp 0.7s cubic-bezier(.4,0,.2,1) ${0.5 + i*0.05}s backwards`,
                      }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:isHighest||day.isToday?700:600, color:isHighest||day.isToday?'#0F172A':'#94A3B8' }}>{day.label}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize:12, color:'#94A3B8', marginTop:14, paddingTop:14, borderTop:'1px solid #EEF2F8' }}>
              {bestDay.count > 0
                ? <>Best day <strong style={{ color:'#0F172A', fontWeight:700 }}>{bestDay.label}</strong> — {bestDay.count} lecture{bestDay.count!==1?'s':''} rated</>
                : 'No activity this week yet'}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="prog-card" style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:18, padding:20, boxShadow:'0 4px 20px -2px rgba(15,23,42,.05)', animation:'fadeUp .5s ease .44s backwards' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#A0A8B8', letterSpacing:'.06em', textTransform:'uppercase', margin:'0 0 16px' }}>Recent Activity</p>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize:13, color:'#94A3B8', textAlign:'center', padding:'16px 0' }}>No activity yet</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {recentActivity.map((row, i) => {
                  const lec = (row as any).lectures as any
                  const st  = STAR_STYLE[row.stars ?? 0]
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, animation:'slideIn .45s ease backwards', animationDelay:`${0.74 + i*0.06}s` }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:st.bg, color:st.color, flexShrink:0 }}>{STAR_LABELS[row.stars ?? 0]}</span>
                      <span style={{ flex:1, minWidth:0, fontSize:13, fontWeight:500, color:'#475569', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lec?.title ?? 'Lecture'}</span>
                      <span style={{ fontSize:11, color:'#94A3B8', flexShrink:0 }}>{formatDate(row.updated_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </main>
    </>
  )
}