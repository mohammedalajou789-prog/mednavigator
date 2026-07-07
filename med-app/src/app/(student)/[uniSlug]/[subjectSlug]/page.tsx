import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params

  const supabase = await createServerClient()
  const [
    { data: uniRow },
    { data: subRow },
    authUser,
  ] = await Promise.all([
    supabase.from('universities').select('id').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id').eq('slug' as any, subjectSlug).single(),
    getAuthUser(),
  ])
  const universityId = uniRow?.id ?? ''
  const subjectId    = subRow?.id ?? ''
  if (!universityId || !subjectId) notFound()

  let userId: string | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_user_id', authUser.id).single()
    userId = profile?.id ?? null
  }

  const [{ data: university }, { data: subject }] = await Promise.all([
    supabase.from('universities').select('id,name').eq('id', universityId).single(),
    supabase.from('subjects').select('id,name,description,access_mode,subject_type').eq('id', subjectId).eq('is_published', true).single(),
  ])
  if (!subject || !university) notFound()

  const isSystem = subject.subject_type === 'system'

  const [
    { data: chapters },
    { data: subSubjects },
    { data: lectures },
    { data: videos },
    { data: clinicalModules },
  ] = await Promise.all([
    supabase.from('chapters').select('id,title,display_order,slug').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('sub_subjects').select('id,title,display_order,slug').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('lectures').select('id,title,chapter_id,sub_subject_id,display_order,slug' as any).eq('subject_id', subjectId).eq('status', 'published').order('display_order') as any,
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])

  const groups = (isSystem ? (subSubjects ?? []) : (chapters ?? [])) as unknown as { id: string; title: string; display_order: number; slug: string }[]
  const lectureList = lectures ?? []
  const lectureIds  = lectureList.map((l: any) => l.id)
  const totalLectures = lectureList.length

  const flashMap: Record<string, number> = {}
  const quizMap:  Record<string, number> = {}
  const pyqMap:   Record<string, number> = {}

  if (lectureIds.length > 0) {
    const { data: contentCounts } = await supabase.rpc('get_content_counts_by_lecture' as any, { lecture_ids: lectureIds })
    contentCounts?.forEach((r: any) => {
      flashMap[r.lecture_id] = r.flashcards_count ?? 0
      quizMap[r.lecture_id]  = r.quiz_count ?? 0
      pyqMap[r.lecture_id]   = r.pyq_count ?? 0
    })
  }

  type ProgressRow = {
    lecture_id: string
    completed: boolean
    last_accessed_at: string | null
    progress_percentage: number
  }
  type ChecklistRow = { lecture_id: string; stars: number }
  let checklistRows: ChecklistRow[] = []

  if (userId && lectureIds.length > 0) {
    const { data } = await supabase
      .from('checklist_progress')
      .select('lecture_id,stars')
      .eq('user_id', userId)
      .in('lecture_id', lectureIds)
    checklistRows = (data ?? []) as ChecklistRow[]
  }

  const starsByLecture: Record<string, number> = {}
  checklistRows.forEach(r => { starsByLecture[r.lecture_id] = r.stars })

  const totalStars    = Object.values(starsByLecture).reduce((s, n) => s + n, 0)
  const progressPercent = totalLectures > 0 ? Math.round((totalStars / (totalLectures * 3)) * 100) : 0

  const groupStats = groups.map(group => {
    const gLectures  = lectureList.filter((l: any) => isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id)
    const gTotal     = gLectures.length
    const gStars     = gLectures.reduce((s: number, l: any) => s + (starsByLecture[l.id] ?? 0), 0)
    const gFlash     = gLectures.reduce((s: number, l: any) => s + (flashMap[l.id] ?? 0), 0)
    const gQuiz      = gLectures.reduce((s: number, l: any) => s + (quizMap[l.id]  ?? 0), 0)
    const gPyq       = gLectures.reduce((s: number, l: any) => s + (pyqMap[l.id]   ?? 0), 0)
    const gPct       = gTotal > 0 ? Math.round((gStars / (gTotal * 3)) * 100) : 0
    return { group, gTotal, gStars, gFlash, gQuiz, gPyq, gPct }
  }).filter(s => s.gTotal > 0)

  const typeBadge   = subject.subject_type === 'system' ? 'System' : subject.subject_type === 'standard' ? 'Standard' : 'Clinical'
  const accessBadge = subject.access_mode  === 'free'   ? 'Free'   : subject.access_mode  === 'mixed'    ? 'Mixed'    : 'Premium'
  const groupLabel  = isSystem ? 'Sub-Subject' : 'Chapter'

  const moduleLabels: Record<string, string> = {
    osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam',
  }

  // Find last accessed lecture for "Continue Learning" banner
  const lastAccessedLecture = lectureList.length > 0 ? lectureList[0] as any : null

  // Progress ring calculation (circumference = 2 * π * r)
  // r = 62 in the design, circ = 389.56
  const ringCircumference = 389.56
  const ringOffset = ringCircumference * (1 - progressPercent / 100)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(245, 247, 252)',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      color: 'rgb(60, 70, 97)',
    }}>
      <main style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '30px 34px 80px',
      }}>

        {/* ── Breadcrumb ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
          <Link href="/home" style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <Link href={`/${uniSlug}`} style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>{university.name}</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <span style={{ color: 'rgb(21, 32, 58)' }}>{subject.name}</span>
        </nav>

        {/* ── Hero Banner ── */}
        <section style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          padding: '30px 34px',
          marginBottom: 30,
          background: 'linear-gradient(120deg, rgb(237, 243, 255) 0%, rgb(243, 247, 255) 52%, rgb(252, 253, 255) 100%)',
          border: '1px solid rgb(226, 234, 251)',
          boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px, rgba(40, 90, 200, 0.5) 0px 24px 50px -34px',
        }}>
          {/* decorative glow */}
          <div style={{
            position: 'absolute',
            top: -60,
            right: 260,
            width: 300,
            height: 180,
            background: 'radial-gradient(rgba(147, 197, 253, 0.32) 0%, rgba(196, 181, 253, 0.12) 55%, transparent 75%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 30, position: 'relative' }}>
            {/* Left content */}
            <div style={{ minWidth: 0, maxWidth: 640 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 20,
                  background: 'rgb(231, 247, 239)', border: '1px solid rgb(199, 235, 216)',
                  color: 'rgb(19, 138, 90)', fontSize: 12.5, fontWeight: 700,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgb(23, 166, 107)' }} />
                  {typeBadge}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 20,
                  background: 'rgb(255, 246, 224)', border: '1px solid rgb(243, 225, 174)',
                  color: 'rgb(161, 115, 10)', fontSize: 12.5, fontWeight: 700,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#E5A700" stroke="#E5A700" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {accessBadge}
                </span>
              </div>

              <h1 style={{
                margin: 0, fontSize: 42, lineHeight: 1.05,
                fontWeight: 800, letterSpacing: '-0.03em', color: 'rgb(21, 32, 58)',
              }}>{subject.name}</h1>

              {subject.description && (
                <p style={{
                  margin: '16px 0 0', fontSize: 15, lineHeight: 1.62,
                  color: 'rgb(85, 97, 125)', maxWidth: 600,
                }}>{subject.description}</p>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 26, marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 10,
                    background: 'rgb(255, 255, 255)', border: '1px solid rgb(226, 234, 251)',
                    color: 'rgb(47, 107, 255)',
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'rgb(21, 32, 58)', lineHeight: 1 }}>{totalLectures}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 3 }}>Lecture{totalLectures !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ width: 1, background: 'rgb(222, 231, 248)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 10,
                    background: 'rgb(255, 255, 255)', border: '1px solid rgb(226, 234, 251)',
                    color: 'rgb(47, 107, 255)',
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" />
                    </svg>
                  </span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'rgb(21, 32, 58)', lineHeight: 1 }}>{groupStats.length}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 3 }}>{groupLabel}{groupStats.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 148, height: 148 }}>
                <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="74" cy="74" r="62" fill="none" stroke="#E1E9FA" strokeWidth="13" />
                  <circle
                    cx="74" cy="74" r="62" fill="none"
                    stroke="url(#pgGrad)" strokeWidth="13" strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                  <defs>
                    <linearGradient id="pgGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#3B79FF" />
                      <stop offset="1" stopColor="#2456D6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'rgb(36, 86, 214)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {progressPercent}%
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 4 }}>
                    {Math.floor(totalStars / 3)} of {totalLectures} lectures
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Continue Learning Banner ── */}
        {lastAccessedLecture && (
          <div style={{
            background: 'linear-gradient(120deg, rgba(37, 99, 235, 0.06), rgb(255, 255, 255) 60%)',
            border: '1px solid rgb(226, 232, 240)',
            borderRadius: 18,
            overflow: 'hidden',
            marginBottom: 34,
            boxShadow: 'rgba(15, 23, 42, 0.04) 0px 1px 3px, rgba(15, 23, 42, 0.10) 0px 10px 24px -16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 24px' }}>
              <div style={{
                width: 54, height: 54, flexShrink: 0, borderRadius: 15,
                background: 'rgb(37, 99, 235)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'rgba(37, 99, 235, 0.35) 0px 6px 16px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <polygon points="7 4 20 12 7 20 7 4" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', color: 'rgb(37, 99, 235)', marginBottom: 3 }}>CONTINUE LEARNING</div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: 'rgb(15, 23, 42)' }}>{lastAccessedLecture.title}</div>
                <div style={{ fontSize: 13, color: 'rgb(100, 116, 139)', marginTop: 2 }}>Pick up where you left off</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[['#EF4444'], ['#F59E0B'], ['#22C55E']].map(([c], i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgb(148, 163, 184)', fontWeight: 600, marginTop: 4 }}>Mastered</div>
              </div>
              <Link
                href={`/${uniSlug}/${subjectSlug}/lecture/${(lastAccessedLecture as any).slug ?? lastAccessedLecture.id}`}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 44, padding: '0 20px',
                  border: 'none', borderRadius: 12,
                  background: 'rgb(37, 99, 235)',
                  color: 'rgb(255, 255, 255)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', textDecoration: 'none',
                }}>
                Resume
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
            {/* Progress bar at bottom */}
            <div style={{ height: 5, background: 'rgba(37, 99, 235, 0.12)' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'rgb(37, 99, 235)',
                transition: 'width 0.6s',
              }} />
            </div>
          </div>
        )}

        {/* ── Two Column Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 348px', gap: 34, alignItems: 'start' }}>

          {/* ── LEFT: Chapters ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'rgb(21, 32, 58)' }}>{groupLabel}s</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(47, 107, 255)' }}>
                {groupStats.length} {groupLabel.toLowerCase()}{groupStats.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groupStats.map(({ group, gTotal, gFlash, gQuiz, gPyq, gPct }) => (
                <Link
                  key={group.id}
                  href={`/${uniSlug}/${subjectSlug}/chapter/${(group as any).slug ?? group.id}`}
                  prefetch={false}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '22px 24px', borderRadius: 18,
                    border: '1px solid rgb(231, 236, 246)',
                    background: 'rgb(255, 255, 255)',
                    cursor: 'pointer',
                    boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px, rgba(40, 90, 200, 0.4) 0px 14px 34px -26px',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                  }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 50, height: 50, borderRadius: 14,
                      background: 'rgb(238, 243, 255)', color: 'rgb(47, 107, 255)', flexShrink: 0,
                    }}>
                      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'rgb(21, 32, 58)', letterSpacing: '-0.01em' }}>{group.title}</h3>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999,
                          background: gPct === 100 ? 'rgb(231, 247, 239)' : gPct > 0 ? 'rgb(255, 246, 224)' : 'rgb(238, 241, 248)',
                          border: `1px solid ${gPct === 100 ? 'rgb(199, 235, 216)' : gPct > 0 ? 'rgb(243, 225, 174)' : 'rgb(222, 226, 238)'}`,
                          color: gPct === 100 ? 'rgb(19, 138, 90)' : gPct > 0 ? 'rgb(161, 115, 10)' : 'rgb(136, 146, 168)',
                          fontSize: 11.5, fontWeight: 700,
                        }}>
                          {gPct === 100 ? 'Done' : gPct > 0 ? `${gPct}%` : 'Not started'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 9, fontSize: 13, fontWeight: 600, color: 'rgb(136, 146, 168)' }}>
                        <span>{gTotal} lecture{gTotal !== 1 ? 's' : ''}</span>
                        {gFlash > 0 && <span>{gFlash} flashcard{gFlash !== 1 ? 's' : ''}</span>}
                        {gQuiz > 0  && <span>{gQuiz} question{gQuiz !== 1 ? 's' : ''}</span>}
                        {gPyq > 0   && <span>{gPyq} PYQ{gPyq !== 1 ? 's' : ''}</span>}
                      </div>
                      <div style={{ marginTop: 13, height: 7, borderRadius: 999, background: 'rgb(234, 240, 251)', overflow: 'hidden', maxWidth: 340 }}>
                        <div style={{
                          height: '100%', width: `${gPct}%`, borderRadius: 999,
                          background: gPct === 100
                            ? 'linear-gradient(90deg, rgb(23, 166, 107), rgb(16, 128, 81))'
                            : 'linear-gradient(90deg, rgb(59, 121, 255), rgb(36, 86, 214))',
                        }} />
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13.5, fontWeight: 700, color: 'rgb(47, 107, 255)', flexShrink: 0,
                    }}>
                      View lectures
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside>
            <h2 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgb(136, 146, 168)' }}>
              More in this subject
            </h2>

            {/* Video Lectures */}
            {videos && videos.length > 0 && (
              <div style={{
                borderRadius: 16, border: '1px solid rgb(231, 236, 246)',
                background: 'rgb(255, 255, 255)', padding: '18px 18px 16px',
                marginBottom: 14, cursor: 'pointer',
                transition: 'background 0.16s ease, border-color 0.16s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, borderRadius: 11,
                    background: 'rgb(238, 243, 255)', color: 'rgb(47, 107, 255)', flexShrink: 0,
                  }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>Video Lectures</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 2 }}>
                      {videos[0]?.title}{videos.length > 1 ? ` · +${videos.length - 1} more` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgb(47, 107, 255)' }}>{videos.length}</span>
                </div>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {videos.slice(0, 2).map((v) => (
                    <a key={v.id} href={v.video_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: 'rgb(85, 97, 125)', cursor: 'pointer', textDecoration: 'none' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(47, 107, 255)' }} />
                      {v.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Years */}
            <Link href={`/${uniSlug}/${subjectSlug}/previous-years`} style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 13,
                borderRadius: 16, border: '1px solid rgb(231, 236, 246)',
                background: 'rgb(255, 255, 255)', padding: '16px 18px',
                cursor: 'pointer', transition: 'background 0.16s ease, border-color 0.16s ease',
              }}>
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 11,
                  background: 'rgb(238, 243, 255)', color: 'rgb(47, 107, 255)', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>Previous Years</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 2 }}>Past papers &amp; MCQ bank</div>
                </div>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            {/* Quiz Bank */}
            <Link href={`/${uniSlug}/${subjectSlug}/quiz-bank`} style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 13,
                borderRadius: 16, border: '1px solid rgb(231, 236, 246)',
                background: 'rgb(255, 255, 255)', padding: '16px 18px',
                cursor: 'pointer', transition: 'background 0.16s ease, border-color 0.16s ease',
              }}>
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 11,
                  background: 'rgb(238, 246, 238)', color: 'rgb(23, 166, 107)', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>Quiz Bank</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 2 }}>All quiz questions in one place</div>
                </div>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            {/* Flashcards Bank */}
            <Link href={`/${uniSlug}/${subjectSlug}/flashcards-bank`} style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 13,
                borderRadius: 16, border: '1px solid rgb(231, 236, 246)',
                background: 'rgb(255, 255, 255)', padding: '16px 18px',
                cursor: 'pointer', transition: 'background 0.16s ease, border-color 0.16s ease',
              }}>
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 11,
                  background: 'rgb(255, 246, 224)', color: 'rgb(201, 148, 0)', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <path d="M6 3h12" /><path d="M4 6h16" />
                  </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>Flashcards Bank</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 2 }}>All flashcards in one place</div>
                </div>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            {/* Clinical Modules */}
            {clinicalModules && clinicalModules.length > 0 && (
              <div style={{
                borderRadius: 16, border: '1px solid rgb(231, 236, 246)',
                background: 'rgb(255, 255, 255)', marginBottom: 12,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, borderRadius: 11,
                    background: 'rgb(231, 247, 239)', color: 'rgb(23, 166, 107)', flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3" />
                      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                      <path d="M16 11V3" /><path d="M8 2v3a4 4 0 0 0 8 0V2" />
                    </svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>OSCE &amp; Oral</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(136, 146, 168)', marginTop: 2 }}>Clinical examination</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgb(23, 166, 107)' }}>{clinicalModules.length}</span>
                </div>
                {clinicalModules.map(mod => (
                  <div key={mod.id}>
                    <div style={{ height: 1, background: 'rgb(231, 236, 246)', margin: '0 18px' }} />
                    <Link href={`/${uniSlug}/${subjectSlug}/clinical/${mod.id}`}
                      style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(23, 166, 107)' }} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'rgb(85, 97, 125)' }}>{moduleLabels[mod.module_type] ?? mod.module_type}</span>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
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