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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
          <Link href="/home" style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>Home</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <Link href={`/${uniSlug}`} style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>{university.name}</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{subject.name}</span>
        </div>

        {/* Hero Banner */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 'clamp(18px, 4vw, 32px) clamp(18px, 4vw, 34px)', marginBottom: 28, background: 'linear-gradient(120deg,rgb(232,240,255) 0%,rgb(239,244,255) 46%,rgb(250,251,255) 100%)', border: '1px solid rgb(223,232,251)', boxShadow: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, height: 160, background: 'radial-gradient(rgba(249,168,212,0.3) 0%,rgba(216,180,254,0.15) 55%,transparent 75%)', pointerEvents: 'none', borderRadius: '50%', filter: 'blur(24px)', zIndex: 0 }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap-reverse' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 999, background: 'rgb(239,244,255)', border: '1px solid rgb(213,226,255)', color: '#2F6BFF' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE0A8' }} />
                  {typeBadge}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 999, background: 'rgb(255,246,224)', border: '1px solid rgb(243,225,174)', color: '#A1730A' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.5 5.5 21 7.5 13.5 2 9 9 9"/></svg>
                  {accessBadge}
                </span>
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 800, letterSpacing: '-0.035em', color: '#15203A' }}>{subject.name}</h1>
              {subject.description && (
                <p style={{ margin: '0 0 22px', fontSize: 14.5, lineHeight: 1.55, color: 'rgba(27,35,53,0.65)' }}>{subject.description}</p>
              )}
              <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(47,107,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#15203A' }}>{totalLectures}</span>
                  <span style={{ fontSize: 13, color: 'rgba(27,35,53,0.55)' }}>Lecture{totalLectures !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(47,107,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#15203A' }}>{groups.length}</span>
                  <span style={{ fontSize: 13, color: 'rgba(27,35,53,0.55)' }}>{groupLabel}{groups.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex" style={{ flexShrink: 0, flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="62" cy="62" r="54" fill="none" stroke="rgba(47,107,255,0.18)" strokeWidth="10"/>
                  <circle cx="62" cy="62" r="54" fill="none" stroke="#2F6BFF" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray="339.3" strokeDashoffset={339.3 * (1 - progressPercent / 100)}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 38, fontWeight: 800, color: '#2F6BFF', letterSpacing: '-0.03em' }}>{progressPercent}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(27,35,53,0.55)', fontWeight: 600 }}>{Math.round(totalStars / 3 * 10) / 10} of {totalLectures} lectures</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 24, alignItems: 'start' }}>

          {/* LEFT: Chapter / Sub-Subject Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{groupLabel}s</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{groupStats.length} {groupLabel.toLowerCase()}{groupStats.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groupStats.map(({ group, gTotal, gStars, gFlash, gQuiz, gPyq, gPct }) => {
                const isDone = gPct === 100
                return (
                  <Link
                    key={group.id}
                    href={`/${uniSlug}/${subjectSlug}/chapter/${(group as any).slug ?? group.id}`}
                    prefetch={false}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: '20px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'rgba(19,138,90,0.11)' : 'rgba(47,107,255,0.10)', color: isDone ? 'var(--success)' : 'var(--primary)' }}>
                          {isDone ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{group.title}</div>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{gTotal} lecture{gTotal !== 1 ? 's' : ''}</span>
                            {gFlash > 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{gFlash} flashcard{gFlash !== 1 ? 's' : ''}</span>}
                            {gQuiz > 0  && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{gQuiz} question{gQuiz !== 1 ? 's' : ''}</span>}
                            {gPyq > 0   && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{gPyq} PYQ{gPyq !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: isDone ? 'var(--success)' : gPct > 0 ? 'var(--warn)' : 'var(--ink-3)', padding: '4px 10px', borderRadius: 8, background: isDone ? 'rgba(19,138,90,0.10)' : gPct > 0 ? 'rgba(216,154,6,0.10)' : 'var(--bg-2)' }}>
                            {isDone ? 'Done' : gPct > 0 ? `${gPct}%` : 'Not started'}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-2)', marginTop: 16, borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${gPct}%`, background: gPct === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: 99 }} />
                      </div>
                      {gStars > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600 }}>
                          {Math.round(gStars / 3 * 10) / 10} of {gTotal} lectures
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>MORE IN THIS SUBJECT</div>

            {videos && videos.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(47,107,255,0.11)', color: 'var(--primary)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>Video Lectures</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{videos[0]?.title ?? ''}{videos.length > 1 ? ` · +${videos.length - 1} more` : ''}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{videos.length}</span>
                </div>
                {videos.slice(0, 2).map((v) => (
                  <div key={v.id}>
                    <div style={{ height: 1, background: 'var(--line)', margin: '0 18px' }} />
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  </div>
                ))}
              </div>
            )}

            <Link href={`/${uniSlug}/${subjectSlug}/previous-years`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(110,107,216,0.11)', color: 'var(--violet)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Previous Years</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Past papers &amp; MCQ bank</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            <Link href={`/${uniSlug}/${subjectSlug}/quiz-bank`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,163,74,0.11)', color: 'var(--success)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Quiz Bank</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>All quiz questions in one place</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            <Link href={`/${uniSlug}/${subjectSlug}/flashcards-bank`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(234,179,8,0.11)', color: '#A1730A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Flashcards Bank</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>All flashcards in one place</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            {clinicalModules && clinicalModules.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(19,138,90,0.11)', color: 'var(--success)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><path d="M16 11V3"/><path d="M8 2v3a4 4 0 0 0 8 0V2"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>OSCE &amp; Oral</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Clinical examination</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>{clinicalModules.length}</span>
                </div>
                {clinicalModules.map(mod => (
                  <div key={mod.id}>
                    <div style={{ height: 1, background: 'var(--line)', margin: '0 18px' }} />
                    <Link href={`/${uniSlug}/${subjectSlug}/clinical/${mod.id}`} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{moduleLabels[mod.module_type] ?? mod.module_type}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
