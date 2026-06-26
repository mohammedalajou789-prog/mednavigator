import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string }>
}

// ─── accent constants ───────────────────────────────────────────────
const ACCENT       = '#2f6bf0'
const ACCENT_SOFT  = '#eef3ff'
const ACCENT_BDR   = '#d5e2ff'

export default async function SubjectPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params
  
  // resolve slug → id
  const supabase0 = await createServerClient()
  const { data: uniRow } = await supabase0.from('universities').select('id').eq('slug' as any, uniSlug).single()
  const { data: subRow } = await supabase0.from('subjects').select('id').eq('slug' as any, subjectSlug).single()
  const universityId = uniRow?.id ?? ''
  const subjectId    = subRow?.id ?? ''
  if (!universityId || !subjectId) notFound()
  const supabase = await createServerClient()

  const authUser = await getAuthUser()

  let userId: string | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_user_id', authUser.id).single()
    userId = profile?.id ?? null
  }

  // ── base data ──────────────────────────────────────────────────────
  const [{ data: university }, { data: subject }] = await Promise.all([
    supabase.from('universities').select('id,name').eq('id', universityId).single(),
    supabase.from('subjects').select('*').eq('id', subjectId).eq('is_published', true).single(),
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
    supabase.from('chapters').select('id,title,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('sub_subjects').select('id,title,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('lectures').select('id,title,chapter_id,sub_subject_id,is_preview,display_order').eq('subject_id', subjectId).eq('status', 'published').order('display_order'),
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])

  const groups      = isSystem ? (subSubjects ?? []) : (chapters ?? [])
  const lectureList = lectures ?? []
  const lectureIds  = lectureList.map(l => l.id)

  // ── content counts per lecture ─────────────────────────────────────
  const sheetMap: Record<string, boolean>  = {}
  const summaryMap: Record<string, boolean> = {}
  const flashMap: Record<string, number>   = {}
  const quizMap: Record<string, number>    = {}
  const pyqMap: Record<string, number>     = {}

  if (lectureIds.length > 0) {
    const [
      { data: sheets },
      { data: summaries },
      { data: flashcards },
      { data: quizzes },
      { data: pyqs },
    ] = await Promise.all([
      supabase.from('sheets').select('lecture_id').in('lecture_id', lectureIds).eq('status', 'published'),
      supabase.from('summaries').select('lecture_id').in('lecture_id', lectureIds).eq('status', 'published'),
      supabase.from('flashcards').select('lecture_id').in('lecture_id', lectureIds),
      supabase.from('quiz_questions').select('lecture_id').in('lecture_id', lectureIds),
      supabase.from('previous_year_questions').select('lecture_id').in('lecture_id', lectureIds),
    ])
    sheets?.forEach(r => { sheetMap[r.lecture_id] = true })
    summaries?.forEach(r => { summaryMap[r.lecture_id] = true })
    flashcards?.forEach(r => { flashMap[r.lecture_id] = (flashMap[r.lecture_id] ?? 0) + 1 })
    quizzes?.forEach(r => { quizMap[r.lecture_id]  = (quizMap[r.lecture_id]  ?? 0) + 1 })
    pyqs?.forEach(r => { pyqMap[r.lecture_id]   = (pyqMap[r.lecture_id]   ?? 0) + 1 })
  }

  // ── user progress ──────────────────────────────────────────────────
  type ProgressRow = { lecture_id: string; completed: boolean; content_type: string; last_accessed_at: string | null; progress_percentage: number }
  let progressRows: ProgressRow[] = []
  let continueRow: ProgressRow | null = null

  if (userId && lectureIds.length > 0) {
    const { data } = await supabase
      .from('user_progress')
      .select('lecture_id,completed,content_type,last_accessed_at,progress_percentage')
      .eq('user_id', userId)
      .in('lecture_id', lectureIds)
    progressRows = (data ?? []) as ProgressRow[]
    const sorted = [...progressRows].sort((a, b) =>
      new Date(b.last_accessed_at ?? 0).getTime() - new Date(a.last_accessed_at ?? 0).getTime())
    continueRow = sorted[0] ?? null
  }

  // helper maps
  const progressByLecture: Record<string, ProgressRow> = {}
  progressRows.forEach(r => { if (!progressByLecture[r.lecture_id] || r.progress_percentage > progressByLecture[r.lecture_id].progress_percentage) progressByLecture[r.lecture_id] = r })

  const completedCount  = Object.values(progressByLecture).filter(r => r.completed).length
  const totalLectures   = lectureList.length
  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0

  // progress ring math (r=34)
  const ringC      = 2 * Math.PI * 34          // ≈213.6
  const ringOffset = ringC * (1 - progressPercent / 100)

  // continue-reading lecture info
  const continueLecture = continueRow ? lectureList.find(l => l.id === continueRow!.lecture_id) : null
  const continueGroup   = continueLecture
    ? groups.find(g => g.id === (isSystem ? continueLecture.sub_subject_id : continueLecture.chapter_id))
    : null
  const continueProgress = continueRow?.progress_percentage ?? 0
  const continueCta      = continueProgress > 0 ? 'Resume reading →' : 'Start reading →'
  const continueLabel    = continueRow?.completed ? 'COMPLETED · REREAD' : continueProgress > 0 ? 'CONTINUE READING' : 'START READING'

  // recently completed (max 3)
  const recentlyCompleted = progressRows
    .filter(r => r.completed)
    .sort((a, b) => new Date(b.last_accessed_at ?? 0).getTime() - new Date(a.last_accessed_at ?? 0).getTime())
    .slice(0, 3)

  // ── SVG helpers ────────────────────────────────────────────────────
  const chevronRight = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4cad4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6"/>
    </svg>
  )

  const moduleLabels: Record<string, string> = {
    osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam',
  }

  // ── subject badges ─────────────────────────────────────────────────
  const typeBadge = subject.subject_type === 'system' ? 'System' : subject.subject_type === 'standard' ? 'Standard' : 'Clinical'
  const accessBadge = subject.access_mode === 'free' ? 'Free' : subject.access_mode === 'mixed' ? 'Mixed' : 'Premium'

  // ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f8', color: '#141b2e' }}>
      <main style={{ padding: '26px 36px 60px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8a93a6', marginBottom: '18px' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: '#cdd2db' }}>/</span>
          <Link href={`/${universityId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{university.name}</Link>
          <span style={{ color: '#cdd2db' }}>/</span>
          <span style={{ color: '#141b2e', fontWeight: 600 }}>{subject.name}</span>
        </div>

        {/* ── HERO HEADER ── */}
        <section style={{
          background: '#fff', border: '1px solid #ebedf1', borderRadius: '22px',
          padding: '30px 32px', display: 'flex', gap: '30px', alignItems: 'center',
          boxShadow: '0 1px 2px rgba(20,27,46,0.03)', marginBottom: '26px',
        }}>
          {/* left info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.02em',
                color: '#1c7a4d', background: '#e6f6ee', padding: '4px 11px', borderRadius: '20px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1c9d62', display: 'inline-block' }} />
                {typeBadge}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.02em',
                color: '#9a6510', background: '#fdf2dd', padding: '4px 11px', borderRadius: '20px',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 20 12 16.5 6.4 20l1.4-6.7L3 9l6.4-.7z"/>
                </svg>
                {accessBadge}
              </span>
            </div>

            {/* title */}
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: '36px', fontWeight: 700,
              letterSpacing: '-0.02em', margin: '0 0 8px', color: '#101729',
            }}>{subject.name}</h1>

            {/* description */}
            {subject.description && (
              <p style={{ fontSize: '15px', color: '#6b7589', margin: '0 0 18px', maxWidth: '560px', lineHeight: 1.5 }}>
                {subject.description}
              </p>
            )}

            {/* stat pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* lectures count */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 600, color: '#3a4458', background: '#f4f5f8', padding: '7px 13px', borderRadius: '11px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3h11l4 4v14H5z"/><path d="M16 3v4h4"/><path d="M9 13h7M9 17h5"/>
                </svg>
                {totalLectures} Lectures
              </span>
              {/* chapters count */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 600, color: '#3a4458', background: '#f4f5f8', padding: '7px 13px', borderRadius: '11px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.9">
                  <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H20v16H5.5A1.5 1.5 0 0 1 4 18.5z"/>
                  <path d="M4 4v16"/>
                </svg>
                {groups.length} {isSystem ? 'Sub-Subjects' : 'Chapters'}
              </span>
              {/* content types pill */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 600, color: '#3a4458', background: '#f4f5f8', padding: '7px 13px', borderRadius: '11px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>
                </svg>
                Sheet · Summary · Quiz
              </span>
            </div>
          </div>

          {/* progress ring */}
          <div style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '6px', paddingLeft: '28px', borderLeft: '1px solid #eef0f3',
          }}>
            <div style={{ position: 'relative', width: '104px', height: '104px' }}>
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r="34" fill="none" stroke="#eef0f4" strokeWidth="9"/>
                <circle cx="52" cy="52" r="34" fill="none" stroke={ACCENT} strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 52 52)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Space Grotesk'", fontSize: '24px', fontWeight: 700, color: '#101729' }}>
                  {progressPercent}%
                </span>
              </div>
            </div>
            <span style={{ fontSize: '12.5px', color: '#8a93a6', fontWeight: 500 }}>
              {completedCount} of {totalLectures} done
            </span>
          </div>
        </section>

        {/* ── TWO-COLUMN GRID ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '26px', alignItems: 'flex-start' }}>

          {/* ══ LEFT: LECTURES ══ */}
          <div style={{ flex: '3 1 540px', minWidth: 0 }}>

            {/* section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700,
                letterSpacing: '-0.01em', margin: 0, color: '#101729',
              }}>Lectures</h2>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: ACCENT, background: ACCENT_SOFT, padding: '3px 10px', borderRadius: '20px' }}>
                {totalLectures} units
              </span>
            </div>

            {/* ── CONTINUE READING / FEATURED CARD ── */}
            {continueLecture && (
              <Link href={`/${universityId}/${subjectId}/${continueLecture.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '22px' }}>
                <div style={{
                  background: 'linear-gradient(135deg,#101729,#1b2540)',
                  borderRadius: '22px', padding: '20px 22px',
                  display: 'flex', gap: '22px', alignItems: 'center',
                  boxShadow: '0 18px 40px -22px rgba(16,23,41,0.6)',
                }}>
                  {/* sheet preview mockup */}
                  <div style={{ position: 'relative', width: '148px', height: '152px', flexShrink: 0 }}>
                    <div style={{
                      position: 'absolute', inset: 0, background: '#fff', borderRadius: '13px',
                      transform: 'rotate(-5deg)', boxShadow: '0 10px 24px -10px rgba(0,0,0,0.5)', opacity: 0.5,
                    }} />
                    <div style={{
                      position: 'absolute', inset: 0, background: '#fff', borderRadius: '13px',
                      padding: '16px 14px', boxShadow: '0 14px 30px -12px rgba(0,0,0,0.55)',
                      display: 'flex', flexDirection: 'column', gap: '7px',
                    }}>
                      <div style={{ height: '8px', width: '62%', borderRadius: '4px', background: '#101729' }} />
                      <div style={{ height: '6px', width: '100%', borderRadius: '4px', background: '#e4e8f0' }} />
                      <div style={{ height: '6px', width: '92%',  borderRadius: '4px', background: '#e4e8f0' }} />
                      <div style={{ height: '6px', width: '74%',  borderRadius: '4px', background: ACCENT_SOFT }} />
                      <div style={{ height: '6px', width: '96%',  borderRadius: '4px', background: '#e4e8f0' }} />
                      <div style={{ height: '6px', width: '58%',  borderRadius: '4px', background: '#fdf2dd' }} />
                      <div style={{ height: '6px', width: '88%',  borderRadius: '4px', background: '#e4e8f0' }} />
                      <div style={{ marginTop: 'auto', alignSelf: 'flex-start', fontSize: '9.5px', fontWeight: 700, color: ACCENT, background: ACCENT_SOFT, padding: '3px 8px', borderRadius: '6px' }}>SHEET</div>
                    </div>
                  </div>

                  {/* text side */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: '#7f8db3', marginBottom: '8px' }}>
                      {continueLabel}
                    </div>
                    <h3 style={{
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 600,
                      color: '#fff', margin: '0 0 4px', letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{continueLecture.title}</h3>
                    <div style={{ fontSize: '13px', color: '#9aa6c4', marginBottom: '14px' }}>
                      {continueGroup?.title ?? ''} · Sheet
                    </div>

                    {/* progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${continueProgress}%`, background: ACCENT, borderRadius: '6px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#9aa6c4', minWidth: '60px' }}>
                        {continueProgress}% read
                      </span>
                    </div>

                    {/* CTA row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '18px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: ACCENT, color: '#fff', fontSize: '14px', fontWeight: 700,
                        padding: '11px 22px', borderRadius: '12px',
                      }}>{continueCta}</span>
                      <div style={{ display: 'flex', gap: '7px' }}>
                        {(['Summary', 'Flashcards', 'Quiz'] as const).map(label => (
                          <span key={label} style={{
                            fontSize: '12px', fontWeight: 600, color: '#c5cee2',
                            background: 'rgba(255,255,255,0.08)', padding: '7px 12px', borderRadius: '9px',
                          }}>{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* ── LECTURE CARDS grouped by chapter/sub-subject ── */}
            {groups.map(group => {
              const groupLectures = lectureList.filter(l =>
                isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id)
              if (groupLectures.length === 0) return null

              return (
                <div key={group.id} style={{ marginBottom: '26px' }}>
                  {/* group label */}
                  <div style={{
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                    color: '#9aa3b2', marginBottom: '12px', paddingLeft: '2px',
                  }}>{group.title.toUpperCase()}</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {groupLectures.map(lecture => {
                      const lp     = progressByLecture[lecture.id]
                      const isDone = lp?.completed ?? false
                      const pct    = lp?.progress_percentage ?? 0
                      const isReading = !isDone && pct > 0
                      const isNew     = !isDone && pct === 0

                      const hasSheet   = sheetMap[lecture.id]   ?? false
                      const hasSummary = summaryMap[lecture.id] ?? false
                      const hasFl      = (flashMap[lecture.id]  ?? 0) > 0
                      const hasQuiz    = (quizMap[lecture.id]   ?? 0) > 0
                      const hasPYQ     = (pyqMap[lecture.id]    ?? 0) > 0

                      const isContinue = lecture.id === continueLecture?.id
                      const cardBorder = isContinue ? ACCENT_BDR : '#ebedf1'
                      const barColor   = isDone ? '#1c9d62' : ACCENT

                      return (
                        <Link key={lecture.id} href={`/${universityId}/${subjectId}/${lecture.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{
                            background: '#fff', border: `1.5px solid ${cardBorder}`,
                            borderRadius: '18px', padding: '18px 20px',
                            cursor: 'pointer', boxShadow: '0 1px 2px rgba(20,27,46,0.03)',
                            transition: 'border-color .14s, box-shadow .14s',
                          }}>
                            {/* header row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              {/* icon */}
                              <div style={{
                                width: '46px', height: '46px', flexShrink: 0, borderRadius: '13px',
                                background: isDone ? '#e6f6ee' : ACCENT_SOFT,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDone ? '#1c9d62' : ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h4"/>
                                </svg>
                              </div>

                              {/* title + subtitle */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#101729', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {lecture.title}
                                </div>
                                <div style={{ fontSize: '12.5px', color: '#8a93a6', marginTop: '2px' }}>
                                  {group.title}
                                  {(flashMap[lecture.id] ?? 0) > 0 && ` · ${flashMap[lecture.id]} flashcards`}
                                  {(quizMap[lecture.id] ?? 0) > 0  && ` · ${quizMap[lecture.id]} questions`}
                                </div>
                              </div>

                              {/* status badge */}
                              {isDone && (
                                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 700, color: '#1c7a4d', background: '#e6f6ee', padding: '6px 12px', borderRadius: '20px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                  Completed
                                </span>
                              )}
                              {isReading && (
                                <span style={{ flexShrink: 0, fontSize: '11.5px', fontWeight: 700, color: '#9a6510', background: '#fdf2dd', padding: '6px 12px', borderRadius: '20px' }}>
                                  {pct}% read
                                </span>
                              )}
                              {isNew && (
                                <span style={{ flexShrink: 0, fontSize: '11.5px', fontWeight: 700, color: '#6b7589', background: '#f1f3f6', padding: '6px 12px', borderRadius: '20px' }}>
                                  Not started
                                </span>
                              )}
                            </div>

                            {/* progress bar */}
                            <div style={{ height: '6px', background: '#f0f1f4', borderRadius: '6px', overflow: 'hidden', margin: '14px 0' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '6px', transition: 'width .3s ease' }} />
                            </div>

                            {/* material chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {hasSheet && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: ACCENT, background: ACCENT_SOFT, border: `1px solid ${ACCENT_BDR}`, padding: '6px 12px', borderRadius: '10px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h4"/></svg>
                                  Sheet
                                </span>
                              )}
                              {hasSummary && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#46506a', background: '#fff', border: '1px solid #e7e9ee', padding: '6px 12px', borderRadius: '10px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                                  Summary
                                </span>
                              )}
                              {hasFl && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#46506a', background: '#fff', border: '1px solid #e7e9ee', padding: '6px 12px', borderRadius: '10px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="13" height="13" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v11"/></svg>
                                  Flashcards
                                </span>
                              )}
                              {hasQuiz && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#46506a', background: '#fff', border: '1px solid #e7e9ee', padding: '6px 12px', borderRadius: '10px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4 1.8c0 1.7-2.5 2-2.5 3.7"/><path d="M12 18h.01"/></svg>
                                  Quiz
                                </span>
                              )}
                              {hasPYQ && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#46506a', background: '#fff', border: '1px solid #e7e9ee', padding: '6px 12px', borderRadius: '10px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
                                  Previous Years
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {groups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a93a6', fontSize: '14px' }}>
                No lectures available yet.
              </div>
            )}
          </div>

          {/* ══ RIGHT: SECONDARY RAIL ══ */}
          <aside style={{ flex: '1 1 300px', minWidth: 0, maxWidth: '336px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#9aa3b2', margin: '6px 4px 12px' }}>
              MORE IN THIS SUBJECT
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>

              {/* Videos */}
              {videos && videos.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #ebedf1', borderRadius: '15px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px' }}>
                    <div style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px', background: ACCENT_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8">
                        <rect x="3" y="5" width="18" height="14" rx="2.5"/>
                        <path d="M10 9l4 3-4 3z" fill={ACCENT} stroke="none"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a2233' }}>Video Lectures</div>
                      <div style={{ fontSize: '12px', color: '#8a93a6' }}>{videos[0]?.title ?? ''} · {videos.length > 1 ? `+${videos.length - 1} more` : 'preview'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4458' }}>{videos.length}</span>
                      {chevronRight}
                    </div>
                  </div>
                  {/* video list */}
                  {videos.length > 0 && (
                    <div style={{ borderTop: '1px solid #f0f1f4', padding: '6px' }}>
                      {videos.slice(0, 3).map(v => (
                        <a key={v.id} href={v.video_url} target="_blank" rel="noopener noreferrer"
                          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', borderRadius: '10px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#3a4458', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</span>
                          {chevronRight}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Previous Years Bank */}
              <Link href={`/${universityId}/${subjectId}/previous-years`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px', background: '#fff', border: '1px solid #ebedf1', borderRadius: '15px', cursor: 'pointer', transition: 'transform .14s, border-color .14s' }}>
                  <div style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a6df0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a2233' }}>Previous Years</div>
                    <div style={{ fontSize: '12px', color: '#8a93a6' }}>Past papers &amp; MCQ bank</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    {chevronRight}
                  </div>
                </div>
              </Link>

              {/* OSCE / Clinical Modules */}
              {clinicalModules && clinicalModules.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #ebedf1', borderRadius: '15px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px' }}>
                    <div style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px', background: '#e6f6ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c9d62" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3v6a4 4 0 0 0 8 0V3"/>
                        <path d="M10 13v3a5 5 0 0 0 10 0v-2"/>
                        <circle cx="20" cy="11" r="2"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a2233' }}>OSCE &amp; Oral</div>
                      <div style={{ fontSize: '12px', color: '#8a93a6' }}>Clinical examination</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#1c7a4d', background: '#e6f6ee', padding: '4px 9px', borderRadius: '20px' }}>
                      {clinicalModules.length}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid #f0f1f4', padding: '6px' }}>
                    {clinicalModules.map(mod => (
                      <Link key={mod.id} href={`/${universityId}/${subjectId}/clinical/${mod.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', borderRadius: '10px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1c9d62', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#3a4458' }}>
                          {moduleLabels[mod.module_type] ?? mod.module_type}
                        </span>
                        {chevronRight}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Completed */}
              {recentlyCompleted.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#9aa3b2', margin: '14px 4px 0' }}>
                    RECENTLY COMPLETED
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ebedf1', borderRadius: '15px', padding: '7px' }}>
                    {recentlyCompleted.map(prog => {
                      const lec = lectureList.find(l => l.id === prog.lecture_id)
                      if (!lec) return null
                      const iconBg = prog.content_type === 'quiz' ? '#fdf2dd'
                        : prog.content_type === 'flashcard' ? ACCENT_SOFT : '#e6f6ee'
                      const iconStroke = prog.content_type === 'quiz' ? '#c79212'
                        : prog.content_type === 'flashcard' ? ACCENT : '#1c9d62'
                      return (
                        <Link key={`${prog.lecture_id}-${prog.content_type}`} href={`/${universityId}/${subjectId}/${prog.lecture_id}`}
                          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 11px', borderRadius: '11px' }}>
                          <div style={{ width: '30px', height: '30px', flexShrink: 0, borderRadius: '9px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {prog.content_type === 'quiz' ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4 1.8c0 1.7-2.5 2-2.5 3.7"/><path d="M12 18h.01"/>
                              </svg>
                            ) : prog.content_type === 'flashcard' ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="13" height="13" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v11"/>
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2233', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lec.title} — {prog.content_type.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#9aa3b2' }}>Completed</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}

            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}
