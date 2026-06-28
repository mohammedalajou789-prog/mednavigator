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

  const supabaseSlug = await createServerClient()
  const { data: uniRow } = await supabaseSlug.from('universities').select('id').eq('slug' as any, uniSlug).single()
  const { data: subRow } = await supabaseSlug.from('subjects').select('id').eq('slug' as any, subjectSlug).single()
  const { data: lecRow } = await supabaseSlug.from('lectures').select('id').eq('slug' as any, lectureSlug).single()
  const resolvedLectureId = lecRow?.id ?? ''
  const universityId = uniRow?.id ?? ''
  const subjectId    = subRow?.id ?? ''
  if (!universityId || !subjectId) redirect('/')
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userId: string | null = null
  let userName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('auth_user_id', user.id)
      .single()
    userId = profile?.id ?? null
    userName = profile?.full_name ?? null
  }

  const [
    { data: lecture },
    { data: subject },
    accessResult,
  ] = await Promise.all([
    supabase.from('lectures').select('id, title, description, status').eq('id', resolvedLectureId).eq('status', 'published').single(),
    supabase.from('subjects').select('id, name, access_mode, is_free').eq('id', subjectId).single(),
    checkUserAccess(subjectId, userId),
  ])

  if (!lecture) redirect(`/${universityId}/${subjectId}`)
  if (!subject) redirect(`/${universityId}`)

  const accessAllowed = accessResult.allowed

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
    supabase.from('videos').select('id, title, description, video_url, is_preview, display_order').eq('lecture_id', resolvedLectureId).order('display_order'),
    supabase.from('sheets').select('id').eq('lecture_id', resolvedLectureId).maybeSingle(),
    supabase.from('summaries').select('id').eq('lecture_id', resolvedLectureId).maybeSingle(),
  ])

  const sheetImageSlots: Record<number, string> = {}
  const summaryImageSlots: Record<number, string> = {}

  if (sheetData?.id) {
    const { data: slots } = await supabase.from('image_slots').select('slot_number, media_library(file_url)').eq('entity_type', 'sheet').eq('entity_id', sheetData.id)
    if (slots) {
      for (const slot of slots) {
        const media = slot.media_library as { file_url: string } | null
        if (media?.file_url) sheetImageSlots[slot.slot_number] = media.file_url
      }
    }
  }

  if (summaryData?.id) {
    const { data: slots } = await supabase.from('image_slots').select('slot_number, media_library(file_url)').eq('entity_type', 'summary').eq('entity_id', summaryData.id)
    if (slots) {
      for (const slot of slots) {
        const media = slot.media_library as { file_url: string } | null
        if (media?.file_url) summaryImageSlots[slot.slot_number] = media.file_url
      }
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
        is_preview: v.is_preview ?? false,
        display_order: v.display_order ?? 0,
      }))}
      sheetImageSlots={sheetImageSlots}
      summaryImageSlots={summaryImageSlots}
    />
  )
}