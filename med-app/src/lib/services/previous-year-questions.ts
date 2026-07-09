import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'

export async function getPreviousYearQuestionsByLectureId(
  lectureId: string,
  subjectId: string,
  userId: string | null,
  accessAllowed?: boolean
) {
  const allowed = accessAllowed ?? (await checkUserAccess(subjectId, userId)).allowed
  if (!allowed) {
    return { data: null, error: null, locked: true }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('previous_year_questions')
    .select(
      'id, question, options, correct_answer, explanation, exam_year, exam_type, batch_name'
    )
    .eq('lecture_id', lectureId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
  return { data, error, locked: false }
}