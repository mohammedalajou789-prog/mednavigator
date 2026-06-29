import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'
import { redirect } from 'next/navigation'
import LectureHub from '@/components/student/LectureHub'

interface PageProps {
  params: Promise<{
    uniSlug: string
    subjectSlug: string
    lectureSlug: string
  }>
}

export default async function LecturePage({ params }: PageProps) {
  const { uniSlug, subjectSlug, lectureSlug } = await params

  const supabase = await createServerClient()

  // ── STEP 1 ───────────────────────────────────────────────────────────────
  // Resolve slugs + auth in ONE parallel round trip.
  // We only fetch lightweight data here — no content yet.
  // Content (sheet, flashcards, quiz, pyq) is fetched client-side on demand.
  // ─────────────────────────────────────────────────────────────────────────
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

  const universityId      = uniRow?.id ?? ''
  const resolvedLectureId = lecture?.id ?? ''
  const subjectId         = subject?.id ?? ''

  if (!universityId || !subjectId) redirect('/')
  if (!lecture)                    redirect(`/${uniSlug}/${subjectSlug}`)
  if (!subject)                    redirect(`/${uniSlug}`)

  // ── STEP 2 ───────────────────────────────────────────────────────────────
  // Fetch user profile + access check in parallel.
  // ─────────────────────────────────────────────────────────────────────────
  let userId:   string | null = null
  let userName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('auth_user_id', user.id)
      .single()
    userId   = profile?.id        ?? null
    userName = profile?.full_name ?? null
  }

  const accessAllowed = (await checkUserAccess(subjectId, userId)).allowed

  // ── STEP 3 ───────────────────────────────────────────────────────────────
  // Fetch only lightweight metadata — no content bodies.
  // We check which tabs exist (sheet/summary/flashcards/quiz/pyq)
  // without fetching their actual content.
  // ─────────────────────────────────────────────────────────────────────────
  const [
    { data: sheetMeta },
    { data: summaryMeta },
    { count: flashcardsCount },
    { count: quizCount },
    { count: pyqCount },
    { data: videos },
  ] = await Promise.all([
    supabase.from('sheets').select('id').eq('lecture_id', resolvedLectureId)
      .eq('status', 'published').maybeSingle(),
    supabase.from('summaries').select('id').eq('lecture_id', resolvedLectureId)
      .eq('status', 'published').maybeSingle(),
    supabase.from('flashcards').select('id', { count: 'exact', head: true })
      .eq('lecture_id', resolvedLectureId),
    supabase.from('quiz_questions').select('id', { count: 'exact', head: true })
      .eq('lecture_id', resolvedLectureId),
    supabase.from('previous_year_questions').select('id', { count: 'exact', head: true })
      .eq('lecture_id', resolvedLectureId),
    supabase.from('videos').select('id, title, description, video_url, is_preview, display_order')
      .eq('lecture_id', resolvedLectureId).order('display_order'),
  ])

  return (
    <LectureHub
      lecture={lecture}
      subject={subject}
      universityId={uniSlug}
      subjectSlug={subjectSlug}
      userName={userName ?? undefined}
      userId={userId ?? undefined}
      accessAllowed={accessAllowed}
      hasSheet={!!sheetMeta}
      hasSummary={!!summaryMeta}
      flashcardsCount={flashcardsCount ?? 0}
      quizCount={quizCount ?? 0}
      pyqCount={pyqCount ?? 0}
      videos={(videos ?? []).map(v => ({
        ...v,
        is_preview:    v.is_preview    ?? false,
        display_order: v.display_order ?? 0,
      }))}
    />
  )
}