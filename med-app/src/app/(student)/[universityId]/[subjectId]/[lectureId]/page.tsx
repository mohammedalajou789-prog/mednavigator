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
    universityId: string
    subjectId: string
    lectureId: string
  }>
}

export default async function LecturePage({ params }: PageProps) {
  const { universityId, subjectId, lectureId } = await params
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

  const { data: lecture } = await supabase
    .from('lectures')
    .select('id, title, description, status')
    .eq('id', lectureId)
    .eq('status', 'published')
    .single()

  if (!lecture) {
    redirect(`/${universityId}/${subjectId}`)
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, access_mode, is_free')
    .eq('id', subjectId)
    .single()

  if (!subject) {
    redirect(`/${universityId}`)
  }

  // Access check runs ONCE — result passed to all 5 service functions
  const accessResult = await checkUserAccess(subjectId, userId)
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
    getSheetByLectureId(lectureId, subjectId, userId, accessAllowed),
    getSummaryByLectureId(lectureId, subjectId, userId, accessAllowed),
    getFlashcardsByLectureId(lectureId, subjectId, userId, accessAllowed),
    getQuizQuestionsByLectureId(lectureId, subjectId, userId, accessAllowed),
    getPreviousYearQuestionsByLectureId(lectureId, subjectId, userId, accessAllowed),
    supabase
      .from('videos')
      .select('id, title, description, video_url, is_preview, display_order')
      .eq('lecture_id', lectureId)
      .order('display_order'),
    supabase
      .from('sheets')
      .select('id')
      .eq('lecture_id', lectureId)
      .maybeSingle(),
    supabase
      .from('summaries')
      .select('id')
      .eq('lecture_id', lectureId)
      .maybeSingle(),
  ])

  const sheetImageSlots: Record<number, string> = {}
  const summaryImageSlots: Record<number, string> = {}

  if (sheetData?.id) {
    const { data: slots } = await supabase
      .from('image_slots')
      .select('slot_number, media_library(file_url)')
      .eq('entity_type', 'sheet')
      .eq('entity_id', sheetData.id)

    if (slots) {
      for (const slot of slots) {
        const media = slot.media_library as { file_url: string } | null
        if (media?.file_url) {
          sheetImageSlots[slot.slot_number] = media.file_url
        }
      }
    }
  }

  if (summaryData?.id) {
    const { data: slots } = await supabase
      .from('image_slots')
      .select('slot_number, media_library(file_url)')
      .eq('entity_type', 'summary')
      .eq('entity_id', summaryData.id)

    if (slots) {
      for (const slot of slots) {
        const media = slot.media_library as { file_url: string } | null
        if (media?.file_url) {
          summaryImageSlots[slot.slot_number] = media.file_url
        }
      }
    }
  }

  return (
    <LectureHub
      lecture={lecture}
      subject={subject}
      universityId={universityId}
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