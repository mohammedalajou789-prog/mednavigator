import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'

export async function getFlashcardsByLectureId(
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
    .from('flashcards')
    .select('id, front_text, back_text, tags, display_order')
    .eq('lecture_id', lectureId)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  return { data, error, locked: false }
}

export async function getFlashcardsBySubjectId(
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
    .from('flashcards')
    .select('id, lecture_id, front_text, back_text, tags, display_order')
    .in('lecture_id', lectureIds)
    .is('archived_at', null)
    .order('display_order', { ascending: true })

  if (error) return { data: null, locked: false }
  return { data: data ?? [], locked: false }
}
