import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'
import { redirect } from 'next/navigation'
import LectureSidebarShell from '@/components/student/LectureSidebarShell'

interface LayoutProps {
  params: Promise<{
    uniSlug: string
    subjectSlug: string
    lectureSlug: string
  }>
  children: React.ReactNode
}

export default async function LectureLayout({ params, children }: LayoutProps) {
  const { uniSlug, subjectSlug, lectureSlug } = await params

  const supabase = await createServerClient()

  // ── STEP 1: Resolve slugs + auth in ONE parallel round trip ──────────────
  const [
    { data: uniRow },
    { data: lecture },
    { data: subject },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('universities').select('id').eq('slug' as any, uniSlug).single(),
    supabase.from('lectures').select('id, title, description, status')
      .eq('slug' as any, lectureSlug).eq('status', 'published').single(),
    supabase.from('subjects').select('id, name, access_mode, is_free')
      .eq('slug' as any, subjectSlug).single(),
    supabase.auth.getUser(),
  ])

  if (!uniRow?.id || !subject?.id) redirect('/')
  if (!lecture)                     redirect(`/${uniSlug}/${subjectSlug}`)
  if (!subject)                     redirect(`/${uniSlug}`)

  // ── STEP 2: Profile + tab metadata in ONE parallel round trip ─────────────
  const [
    profileResult,
    sheetMetaResult,
    summaryMetaResult,
    flashcardsCountResult,
    quizCountResult,
    pyqCountResult,
  ] = await Promise.all([
    user
      ? supabase.from('users').select('id, full_name').eq('auth_user_id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from('sheets').select('id').eq('lecture_id', lecture.id).maybeSingle(),
    supabase.from('summaries').select('id').eq('lecture_id', lecture.id).maybeSingle(),
    supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('lecture_id', lecture.id),
    supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('lecture_id', lecture.id),
    supabase.from('previous_year_questions').select('id', { count: 'exact', head: true }).eq('lecture_id', lecture.id),
  ])

  const profile  = (profileResult as any).data
  const userId   = profile?.id        ?? null
  const userName = profile?.full_name ?? null

  const hasSheet        = !!sheetMetaResult.data
  const hasSummary      = !!summaryMetaResult.data
  const flashcardsCount = (flashcardsCountResult as any).count ?? 0
  const quizCount       = (quizCountResult as any).count       ?? 0
  const pyqCount        = (pyqCountResult as any).count        ?? 0

  // ── STEP 3: Access check (needs userId, runs after profile) ───────────────
  const accessAllowed = (await checkUserAccess(subject.id, userId)).allowed

  // ── Build tab list ─────────────────────────────────────────────────────────
  const allTabs = [
    hasSheet            && 'sheet',
    hasSummary          && 'summary',
    flashcardsCount > 0 && 'flashcards',
    quizCount > 0       && 'quiz',
    pyqCount > 0        && 'previous-years',
  ].filter(Boolean) as string[]

  const availableTabs = allTabs.length > 0
    ? allTabs
    : ['sheet', 'summary', 'flashcards', 'quiz', 'previous-years']

  return (
    <div className="flex" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden', position: 'relative' }}>
      {/* ── CENTER: scrollable content area ── */}
      <div
        id="lecture-content-scroll"
        className="flex-1 min-w-0"
        style={{ overflowY: 'auto', height: 'calc(100vh - 72px)', background: '#F5F6FA' }}
      >
        {children}
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <LectureSidebarShell
        allTabs={availableTabs}
        uniSlug={uniSlug}
        subjectSlug={subjectSlug}
        lectureSlug={lectureSlug}
        lecture={lecture}
        subject={subject}
        userId={userId}
        userName={userName}
        accessAllowed={accessAllowed}
      />
    </div>
  )
}
