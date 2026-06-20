import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'

/**
 * Get a sheet by its lecture ID.
 * Requires subjectId and userId to enforce access control.
 */
export async function getSheetByLectureId(
  lectureId: string,
  subjectId: string,
  userId: string | null
) {
  const access = await checkUserAccess(subjectId, userId)

  if (!access.allowed) {
    return { data: null, error: null, locked: true }
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('sheets')
    .select('id, title, content, status, version, updated_at')
    .eq('lecture_id', lectureId)
    .eq('status', 'published')
    .maybeSingle()

  return { data, error, locked: false }
}