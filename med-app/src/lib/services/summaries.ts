import { createServerClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/services/subscriptions'

export async function getSummaryByLectureId(
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
    .from('summaries')
    .select('id, title, content, status, version, updated_at')
    .eq('lecture_id', lectureId)
    .eq('status', 'published')
    .maybeSingle()
  return { data, error, locked: false }
}