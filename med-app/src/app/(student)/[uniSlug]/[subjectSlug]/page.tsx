import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params

  // ── resolve slug → id ────────────────────────────────────────────
  const supabase0 = await createServerClient()
  const { data: uniRow } = await supabase0.from('universities').select('id').eq('slug' as any, uniSlug).single()
  const { data: subRow } = await supabase0.from('subjects').select('id').eq('slug' as any, subjectSlug).single()
  const universityId = uniRow?.id ?? ''
  const subjectId    = subRow?.id ?? ''
  if (!universityId || !subjectId) notFound()

  const supabase  = await createServerClient()
  const authUser  = await getAuthUser()

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
    supabase.from('lectures').select('id,title,chapter_id,sub_subject_id,is_preview,display_order,slug' as any).eq('subject_id', subjectId).eq('status', 'published').order('display_order') as any,
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])

  const groups      = isSystem ? (subSubjects ?? []) : (chapters ?? [])
  const lectureList = lectures ?? []
  const lectureIds  = lectureList.map((l: any) => l.id)

  // ── content counts per lecture ─────────────────────────────────────
  const sheetMap:   Record<string, boolean> = {}
  const summaryMap: Record<string, boolean> = {}
  const flashMap:   Record<string, number>  = {}
  const quizMap:    Record<string, number>  = {}
  const pyqMap:     Record<string, number>  = {}

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
    sheets?.forEach(r    => { sheetMap[r.lecture_id]   = true })
    summaries?.forEach(r => { summaryMap[r.lecture_id] = true })
    flashcards?.forEach(r => { flashMap[r.lecture_id]  = (flashMap[r.lecture_id]  ?? 0) + 1 })
    quizzes?.forEach(r   => { quizMap[r.lecture_id]    = (quizMap[r.lecture_id]   ?? 0) + 1 })
    pyqs?.forEach(r      => { pyqMap[r.lecture_id]     = (pyqMap[r.lecture_id]    ?? 0) + 1 })
  }

  // ── user progress ──────────────────────────────────────────────────
  type ProgressRow = {
    lecture_id: string
    completed: boolean
    content_type: string
    last_accessed_at: string | null
    progress_percentage: number
  }
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

  const progressByLecture: Record<string, ProgressRow> = {}
  progressRows.forEach(r => {
    if (!progressByLecture[r.lecture_id] || r.progress_percentage > progressByLecture[r.lecture_id].progress_percentage)
      progressByLecture[r.lecture_id] = r
  })

  const completedCount  = Object.values(progressByLecture).filter(r => r.completed).length
  const totalLectures   = lectureList.length
  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0

  // progress ring (r=34, viewBox 104)
  const ringC      = 2 * Math.PI * 34
  const ringOffset = ringC * (1 - progressPercent / 100)

  // continue-reading
  const continueLecture  = continueRow ? lectureList.find((l: any) => l.id === continueRow!.lecture_id) : null
  const continueGroup    = continueLecture
    ? groups.find(g => g.id === (isSystem ? (continueLecture as any).sub_subject_id : (continueLecture as any).chapter_id))
    : null
  const continueProgress = continueRow?.progress_percentage ?? 0
  const continueCta      = continueProgress > 0 ? 'Resume reading →' : 'Start reading →'
  const continueLabel    = continueRow?.completed ? 'COMPLETED · REREAD' : continueProgress > 0 ? 'CONTINUE READING' : 'START READING'

  // recently completed (max 3)
  const recentlyCompleted = progressRows
    .filter(r => r.completed)
    .sort((a, b) => new Date(b.last_accessed_at ?? 0).getTime() - new Date(a.last_accessed_at ?? 0).getTime())
    .slice(0, 3)

  // badges
  const typeBadge   = subject.subject_type === 'system' ? 'System' : subject.subject_type === 'standard' ? 'Standard' : 'Clinical'
  const accessBadge = subject.access_mode  === 'free'   ? 'Free'   : subject.access_mode  === 'mixed'    ? 'Mixed'    : 'Premium'

  const moduleLabels: Record<string, string> = {
    osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam',
  }

  // shared chevron icon
  const ChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6"/>
    </svg>
  )

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <main className="max-w-screen-xl mx-auto px-6 py-8 pb-16">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-[13px] text-slate-400 mb-6">
          <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Home</Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href={`/${uniSlug}`} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{university.name}</Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-700 dark:text-slate-200 font-semibold">{subject.name}</span>
        </nav>

        {/* ── HERO HEADER ── */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-7 flex gap-8 items-center shadow-sm mb-7">

          {/* left: info */}
          <div className="flex-1 min-w-0">

            {/* type + access badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {typeBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-wide text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.6 6.3L21 9l-4.8 4.3L17.6 20 12 16.5 6.4 20l1.4-6.7L3 9l6.4-.7z"/>
                </svg>
                {accessBadge}
              </span>
            </div>

            {/* subject name */}
            <h1 className="text-[34px] font-bold tracking-tight text-slate-900 dark:text-white mb-2 leading-none">
              {subject.name}
            </h1>

            {/* description */}
            {subject.description && (
              <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-5 max-w-xl leading-relaxed">
                {subject.description}
              </p>
            )}

            {/* stat pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3.5 py-2 rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3h11l4 4v14H5z"/><path d="M16 3v4h4"/><path d="M9 13h7M9 17h5"/>
                </svg>
                {totalLectures} Lectures
              </span>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3.5 py-2 rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.9">
                  <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H20v16H5.5A1.5 1.5 0 0 1 4 18.5z"/>
                  <path d="M4 4v16"/>
                </svg>
                {groups.length} {isSystem ? 'Sub-Subjects' : 'Chapters'}
              </span>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3.5 py-2 rounded-xl">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>
                </svg>
                Sheet · Summary · Quiz
              </span>
            </div>
          </div>

          {/* right: progress ring */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2 pl-7 border-l border-slate-100 dark:border-slate-700">
            <div className="relative w-[104px] h-[104px]">
              <svg width="104" height="104" viewBox="0 0 104 104">
                <circle cx="52" cy="52" r="34" fill="none" stroke="#e2e8f0" strokeWidth="9" className="dark:stroke-slate-700" />
                <circle
                  cx="52" cy="52" r="34"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 52 52)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-bold text-slate-900 dark:text-white leading-none">
                  {progressPercent}%
                </span>
              </div>
            </div>
            <span className="text-[12.5px] text-slate-400 font-medium">
              {completedCount} of {totalLectures} done
            </span>
          </div>
        </section>

        {/* ── TWO-COLUMN GRID ── */}
        <div className="flex flex-wrap gap-7 items-start">

          {/* ╠╠ LEFT: LECTURES ╠╠ */}
          <div className="flex-[3_1_540px] min-w-0">

            {/* section header */}
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                Lectures
              </h2>
              <span className="text-[12.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-0.5 rounded-full">
                {totalLectures} units
              </span>
            </div>

            {/* ── CONTINUE READING CARD ── */}
            {continueLecture && (
              <Link
                href={`/${uniSlug}/${subjectSlug}/${(continueLecture as any).slug ?? continueLecture.id}`}
                className="block mb-6 no-underline"
              >
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 flex gap-6 items-center shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-shadow">

                  {/* sheet mockup thumbnail */}
                  <div className="relative w-36 h-40 flex-shrink-0">
                    <div className="absolute inset-0 bg-white rounded-xl rotate-[-5deg] shadow-xl opacity-40" />
                    <div className="absolute inset-0 bg-white rounded-xl shadow-xl p-4 flex flex-col gap-1.5">
                      <div className="h-2 w-3/5 rounded bg-slate-900" />
                      <div className="h-1.5 w-full rounded bg-slate-100" />
                      <div className="h-1.5 w-11/12 rounded bg-slate-100" />
                      <div className="h-1.5 w-3/4 rounded bg-blue-50" />
                      <div className="h-1.5 w-full rounded bg-slate-100" />
                      <div className="h-1.5 w-3/5 rounded bg-amber-50" />
                      <div className="h-1.5 w-10/12 rounded bg-slate-100" />
                      <div className="mt-auto">
                        <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">SHEET</span>
                      </div>
                    </div>
                  </div>

                  {/* text side */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400 mb-2 uppercase">
                      {continueLabel}
                    </p>
                    <h3 className="text-[22px] font-semibold text-white tracking-tight mb-1 truncate">
                      {continueLecture.title}
                    </h3>
                    <p className="text-[13px] text-slate-400 mb-4">
                      {continueGroup?.title ?? ''} · Sheet
                    </p>

                    {/* progress bar */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${continueProgress}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-400 min-w-[56px]">
                        {continueProgress}% read
                      </span>
                    </div>

                    {/* CTA row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold px-5 py-2.5 rounded-xl transition-colors">
                        {continueCta}
                      </span>
                      <div className="flex gap-2">
                        {(['Summary', 'Flashcards', 'Quiz'] as const).map(label => (
                          <span key={label} className="text-[12px] font-semibold text-slate-400 bg-white/8 px-3 py-1.5 rounded-lg">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* ── LECTURE CARDS grouped by chapter/sub-subject ── */}
            {groups.map(group => {
              const groupLectures = lectureList.filter((l: any) =>
                isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id)
              if (groupLectures.length === 0) return null

              return (
                <div key={group.id} className="mb-7">
                  {/* group label */}
                  <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase mb-3 pl-0.5">
                    {group.title}
                  </p>

                  <div className="flex flex-col gap-3.5">
                    {groupLectures.map((lecture: any) => {
                      const lp       = progressByLecture[lecture.id]
                      const isDone   = lp?.completed ?? false
                      const pct      = lp?.progress_percentage ?? 0
                      const isReading = !isDone && pct > 0
                      const isNew     = !isDone && pct === 0

                      const hasSheet   = sheetMap[lecture.id]   ?? false
                      const hasSummary = summaryMap[lecture.id] ?? false
                      const hasFl      = (flashMap[lecture.id]  ?? 0) > 0
                      const hasQuiz    = (quizMap[lecture.id]   ?? 0) > 0
                      const hasPYQ     = (pyqMap[lecture.id]    ?? 0) > 0

                      const isContinue = lecture.id === continueLecture?.id

                      return (
                        <Link
                          key={lecture.id}
                          href={`/${uniSlug}/${subjectSlug}/${(lecture as any).slug ?? lecture.id}`}
                          className="no-underline block group"
                        >
                          <div className={`
                            bg-white dark:bg-slate-800 rounded-[18px] p-5 shadow-sm
                            border transition-all duration-150
                            group-hover:shadow-md group-hover:border-blue-200 dark:group-hover:border-blue-800
                            ${isContinue
                              ? 'border-blue-200 dark:border-blue-800'
                              : 'border-slate-200 dark:border-slate-700'}
                          `}>

                            {/* header row */}
                            <div className="flex items-center gap-4">

                              {/* icon */}
                              <div className={`
                                w-11 h-11 flex-shrink-0 rounded-[13px] flex items-center justify-center
                                ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}
                              `}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                                  stroke={isDone ? '#16a34a' : '#2563eb'}
                                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M6 3h9l4 4v14H6z"/>
                                  <path d="M15 3v4h4"/>
                                  <path d="M9 12h6M9 16h4"/>
                                </svg>
                              </div>

                              {/* title + meta */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[16px] font-bold text-slate-900 dark:text-white truncate">
                                  {lecture.title}
                                </p>
                                <p className="text-[12.5px] text-slate-400 mt-0.5">
                                  {group.title}
                                  {(flashMap[lecture.id] ?? 0) > 0 && ` · ${flashMap[lecture.id]} flashcards`}
                                  {(quizMap[lecture.id] ?? 0) > 0  && ` · ${quizMap[lecture.id]} questions`}
                                </p>
                              </div>

                              {/* status badge */}
                              {isDone && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                  Completed
                                </span>
                              )}
                              {isReading && (
                                <span className="flex-shrink-0 text-[11.5px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                                  {pct}% read
                                </span>
                              )}
                              {isNew && (
                                <span className="flex-shrink-0 text-[11.5px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
                                  Not started
                                </span>
                              )}
                            </div>

                            {/* progress bar */}
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden my-4">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* content chips */}
                            <div className="flex flex-wrap gap-2">
                              {hasSheet && (
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-3 py-1.5 rounded-[10px]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h4"/>
                                  </svg>
                                  Sheet
                                </span>
                              )}
                              {hasSummary && (
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-[10px]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 6h16M4 12h16M4 18h10"/>
                                  </svg>
                                  Summary
                                </span>
                              )}
                              {hasFl && (
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-[10px]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="6" width="13" height="13" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v11"/>
                                  </svg>
                                  Flashcards
                                </span>
                              )}
                              {hasQuiz && (
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-[10px]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4 1.8c0 1.7-2.5 2-2.5 3.7"/><path d="M12 18h.01"/>
                                  </svg>
                                  Quiz
                                </span>
                              )}
                              {hasPYQ && (
                                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-[10px]">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
                                  </svg>
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
              <div className="text-center py-16 text-slate-400 text-[14px]">
                No lectures available yet.
              </div>
            )}
          </div>

          {/* ╠╠ RIGHT: SECONDARY RAIL ╠╠ */}
          <aside className="flex-[1_1_300px] min-w-0 max-w-[336px]">

            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase mb-3 pl-1">
              More in this subject
            </p>

            <div className="flex flex-col gap-3">

              {/* Video Lectures */}
              {videos && videos.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8">
                        <rect x="3" y="5" width="18" height="14" rx="2.5"/>
                        <path d="M10 9l4 3-4 3z" fill="#2563eb" stroke="none"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-white">Video Lectures</p>
                      <p className="text-[12px] text-slate-400">{videos[0]?.title ?? ''}{videos.length > 1 ? ` · +${videos.length - 1} more` : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{videos.length}</span>
                      <ChevronRight />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 p-1.5">
                    {videos.slice(0, 3).map(v => (
                      <a key={v.id} href={v.video_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors no-underline">
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        <span className="flex-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">{v.title}</span>
                        <ChevronRight />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Years Bank */}
              <Link href={`/${uniSlug}/${subjectSlug}/previous-years`} className="no-underline block group">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all">
                  <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="17" rx="2"/>
                      <path d="M3 9h18M8 2v4M16 2v4"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 dark:text-white">Previous Years</p>
                    <p className="text-[12px] text-slate-400">Past papers &amp; MCQ bank</p>
                  </div>
                  <ChevronRight />
                </div>
              </Link>

              {/* OSCE / Clinical Modules */}
              {clinicalModules && clinicalModules.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3v6a4 4 0 0 0 8 0V3"/>
                        <path d="M10 13v3a5 5 0 0 0 10 0v-2"/>
                        <circle cx="20" cy="11" r="2"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-white">OSCE &amp; Oral</p>
                      <p className="text-[12px] text-slate-400">Clinical examination</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                      {clinicalModules.length}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 p-1.5">
                    {clinicalModules.map(mod => (
                      <Link key={mod.id} href={`/${uniSlug}/${subjectSlug}/clinical/${mod.id}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors no-underline">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="flex-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                          {moduleLabels[mod.module_type] ?? mod.module_type}
                        </span>
                        <ChevronRight />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Completed */}
              {recentlyCompleted.length > 0 && (
                <>
                  <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase mt-2 pl-1">
                    Recently Completed
                  </p>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[15px] p-2 shadow-sm">
                    {recentlyCompleted.map(prog => {
                      const lec = lectureList.find((l: any) => l.id === prog.lecture_id)
                      if (!lec) return null
                      const iconBg     = prog.content_type === 'quiz' ? 'bg-amber-50 dark:bg-amber-900/20' : prog.content_type === 'flashcard' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
                      const iconStroke = prog.content_type === 'quiz' ? '#d97706' : prog.content_type === 'flashcard' ? '#2563eb' : '#16a34a'
                      return (
                        <Link key={`${prog.lecture_id}-${prog.content_type}`}
                          href={`/${uniSlug}/${subjectSlug}/${(lectureList.find((l: any) => l.id === prog.lecture_id) as any)?.slug ?? prog.lecture_id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors no-underline">
                          <div className={`w-8 h-8 flex-shrink-0 rounded-[9px] flex items-center justify-center ${iconBg}`}>
                            {prog.content_type === 'quiz' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4 1.8c0 1.7-2.5 2-2.5 3.7"/><path d="M12 18h.01"/>
                              </svg>
                            ) : prog.content_type === 'flashcard' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="13" height="13" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v11"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">
                              {lec.title} — {prog.content_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[11.5px] text-slate-400">Completed</p>
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