import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'
import { redirect } from 'next/navigation'
import LectureHub from '@/components/student/LectureHub'
import { getSheetByLectureId } from '@/lib/services/sheets'
import { getSummaryByLectureId } from '@/lib/services/summaries'
import { getFlashcardsByLectureId } from '@/lib/services/flashcards'
import { getQuizQuestionsByLectureId } from '@/lib/services/quiz-questions'
import { getPreviousYearQuestionsByLectureId } from '@/lib/services/previous-year-questions'

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

  // ─── STEP 1 ───────────────────────────────────────────────────────────────
  // Resolve slugs AND fetch full lecture + subject data in ONE round trip each.
  // Previously: lectures table was queried TWICE (once for slug, once for data).
  // Now: we select all needed columns in the first query — zero duplicate queries.
  // ─────────────────────────────────────────────────────────────────────────
  const [
    { data: uniRow },
    { data: lecture },          // full lecture data — no second query needed
    { data: subject },          // full subject data — no second query needed
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('universities')
      .select('id')
      .eq('slug' as any, uniSlug)
      .single(),
    supabase
      .from('lectures')
      .select('id, title, description, status')
      .eq('slug' as any, lectureSlug)
      .eq('status', 'published')
      .single(),
    supabase
      .from('subjects')
      .select('id, name, access_mode, is_free')
      .eq('slug' as any, subjectSlug)
      .single(),
    supabase.auth.getUser(),
  ])

  const universityId      = uniRow?.id ?? ''
  const resolvedLectureId = lecture?.id ?? ''
  const subjectId         = subject?.id ?? ''

  if (!universityId || !subjectId) redirect('/')
  if (!lecture)                    redirect(`/${uniSlug}/${subjectSlug}`)
  if (!subject)                    redirect(`/${uniSlug}`)

  // ─── STEP 2 ───────────────────────────────────────────────────────────────
  // Fetch user profile and subscription access in parallel.
  // Profile fetch and access check are independent — run together.
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

  const [
    sheetResult,
    summaryResult,
    flashcardsResult,
    quizResult,
    pyqResult,
    { data: videos },
    { data: sheetData },
    { data: summaryData },
  ] = await Promise.all([
    getSheetByLectureId(resolvedLectureId, subjectId, userId, accessAllowed),
    getSummaryByLectureId(resolvedLectureId, subjectId, userId, accessAllowed),
    getFlashcardsByLectureId(resolvedLectureId, subjectId, userId, accessAllowed),
    getQuizQuestionsByLectureId(resolvedLectureId, subjectId, userId, accessAllowed),
    getPreviousYearQuestionsByLectureId(resolvedLectureId, subjectId, userId, accessAllowed),
    supabase
      .from('videos')
      .select('id, title, description, video_url, is_preview, display_order')
      .eq('lecture_id', resolvedLectureId)
      .order('display_order'),
    supabase
      .from('sheets')
      .select('id')
      .eq('lecture_id', resolvedLectureId)
      .maybeSingle(),
    supabase
      .from('summaries')
      .select('id')
      .eq('lecture_id', resolvedLectureId)
      .maybeSingle(),
  ])

  // ─── STEP 4 ───────────────────────────────────────────────────────────────
  // Fetch image slots for sheet and summary IN PARALLEL (not sequentially).
  // We now know the IDs from Step 3, so we can run both at the same time.
  // ─────────────────────────────────────────────────────────────────────────
  const [sheetSlotsResult, summarySlotsResult] = await Promise.all([
    sheetData?.id
      ? supabase
          .from('image_slots')
          .select('slot_number, media_library(file_url)')
          .eq('entity_type', 'sheet')
          .eq('entity_id', sheetData.id)
      : Promise.resolve({ data: null }),
    summaryData?.id
      ? supabase
          .from('image_slots')
          .select('slot_number, media_library(file_url)')
          .eq('entity_type', 'summary')
          .eq('entity_id', summaryData.id)
      : Promise.resolve({ data: null }),
  ])

  const sheetImageSlots:   Record<number, string> = {}
  const summaryImageSlots: Record<number, string> = {}

  if (sheetSlotsResult.data) {
    for (const slot of sheetSlotsResult.data) {
      const media = slot.media_library as { file_url: string } | null
      if (media?.file_url) sheetImageSlots[slot.slot_number] = media.file_url
    }
  }

  if (summarySlotsResult.data) {
    for (const slot of summarySlotsResult.data) {
      const media = slot.media_library as { file_url: string } | null
      if (media?.file_url) summaryImageSlots[slot.slot_number] = media.file_url
    }
  }

  return (
    <LectureHub
      lecture={lecture}
      subject={subject}
      universityId={uniSlug}
      subjectSlug={subjectSlug}
      userName={userName ?? undefined}
      userId={userId ?? undefined}
      sheet={sheetResult.data}
      sheetLocked={sheetResult.locked}
      summary={summaryResult.data}
      summaryLocked={summaryResult.locked}
      flashcards={flashcardsResult.data ?? []}
      flashcardsLocked={flashcardsResult.locked}
      quizQuestions={quizResult.data ?? []}
      quizLocked={quizResult.locked}
      previousYearQuestions={pyqResult.data ?? []}
      pyqLocked={pyqResult.locked}
      videos={(videos ?? []).map(v => ({
        ...v,
        is_preview:    v.is_preview    ?? false,
        display_order: v.display_order ?? 0,
      }))}
      sheetImageSlots={sheetImageSlots}
      summaryImageSlots={summaryImageSlots}
    />
  )
}