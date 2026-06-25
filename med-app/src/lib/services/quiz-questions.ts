import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'

export async function getQuizQuestionsByLectureId(
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
    .from('quiz_questions')
    .select(
      'id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, tags'
    )
    .eq('lecture_id', lectureId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
  return { data, error, locked: false }
}