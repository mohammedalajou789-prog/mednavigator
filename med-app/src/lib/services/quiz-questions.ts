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

export async function getQuizQuestionsBySubjectId(
  subjectId: string,
  userId: string | null,
  lectureIds: string[]
) {
  const { allowed } = await checkUserAccess(subjectId, userId)
  if (!allowed) {
    return { data: null, locked: true }
  }

  if (lectureIds.length === 0) return { data: [], locked: false }

  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, lecture_id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, tags')
    .in('lecture_id', lectureIds)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  if (error) return { data: null, locked: false }
  return { data: data ?? [], locked: false }
}
