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