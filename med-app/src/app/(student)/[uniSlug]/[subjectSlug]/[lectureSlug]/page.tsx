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

  // ── STEP 1 ──────────────────────────────────────────────────────────────
  // Resolve slugs + auth in ONE parallel round trip.
  // ────────────────────────────────────────────────────────────────────────
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

  // ── STEP 2 ──────────────────────────────────────────────────────────────
  // FIX 4: profile fetch + access check + tab metadata all in ONE parallel
  // round trip. Previously: profile fetch → then access check (2 sequential
  // trips). Now: all run at the same time.
  // ────────────────────────────────────────────────────────────────────────
  const [
    profileResult,
    sheetMetaResult,
    summaryMetaResult,
    flashcardsCountResult,
    quizCountResult,
    pyqCountResult,
    videosResult,
  ] = await Promise.all([
    user
      ? supabase.from('users').select('id, full_name').eq('auth_user_id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from('sheets').select('id').eq('lecture_id', resolvedLectureId).maybeSingle(),
    supabase.from('summaries').select('id').eq('lecture_id', resolvedLectureId).maybeSingle(),
    supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('lecture_id', resolvedLectureId),
    supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('lecture_id', resolvedLectureId),
    supabase.from('previous_year_questions').select('id', { count: 'exact', head: true }).eq('lecture_id', resolvedLectureId),
    supabase.from('videos').select('id, title, description, video_url, is_preview, display_order')
      .eq('lecture_id', resolvedLectureId).order('display_order'),
  ])

  const profile  = (profileResult as any).data
  const userId   = profile?.id        ?? null
  const userName = profile?.full_name ?? null

  const sheetMeta       = sheetMetaResult.data
  const summaryMeta     = summaryMetaResult.data
  const flashcardsCount = (flashcardsCountResult as any).count ?? 0
  const quizCount       = (quizCountResult as any).count       ?? 0
  const pyqCount        = (pyqCountResult as any).count        ?? 0
  const videos          = videosResult.data ?? []

  // ── STEP 3 ──────────────────────────────────────────────────────────────
  // Access check runs after profile is resolved (needs userId).
  // This is a single fast query — cannot be parallelized with profile
  // because it depends on userId.
  // ────────────────────────────────────────────────────────────────────────
  const accessAllowed = (await checkUserAccess(subjectId, userId)).allowed

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
      flashcardsCount={flashcardsCount}
      quizCount={quizCount}
      pyqCount={pyqCount}
      videos={videos.map((v: any) => ({
        ...v,
        is_preview:    v.is_preview    ?? false,
        display_order: v.display_order ?? 0,
      }))}
    />
  )
}