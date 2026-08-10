'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

interface Props {
  lectureId: string
}

export default function LectureAccessTracker({ lectureId }: Props) {
  const { user } = useUserStore()
  const supabase = createClient()

  useEffect(() => {
    if (!user || !lectureId) return

    // Fire-and-forget: update last_accessed_at for all content types of this lecture
    async function trackAccess() {
      const now = new Date().toISOString()

      // Get existing progress rows for this lecture
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, content_type')
        .eq('user_id', user!.id)
        .eq('lecture_id', lectureId)

      if (existing && existing.length > 0) {
        // Update last_accessed_at for all existing rows
        await supabase
          .from('user_progress')
          .update({ last_accessed_at: now, updated_at: now })
          .eq('user_id', user!.id)
          .eq('lecture_id', lectureId)
      } else {
        // No rows yet — insert a minimal row for 'sheet' so continue learning works
        await supabase
          .from('user_progress')
          .upsert({
            user_id:             user!.id,
            lecture_id:          lectureId,
            content_type:        'sheet',
            progress_percentage: 0,
            completed:           false,
            last_accessed_at:    now,
            updated_at:          now,
          }, { onConflict: 'user_id,lecture_id,content_type' })
      }
    }

    trackAccess()
  }, [lectureId, user])

  return null
}
