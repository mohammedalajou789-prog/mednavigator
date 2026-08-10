'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

const VALID_TABS = ['sheet', 'summary', 'flashcards', 'quiz', 'previous-years']

export default function LecturePage() {
  const params      = useParams()
  const router      = useRouter()
  const uniSlug     = params.uniSlug     as string
  const subjectSlug = params.subjectSlug as string
  const lectureSlug = params.lectureSlug as string
  const { user }    = useUserStore()
  const supabase    = createClient()

  useEffect(() => {
    async function resolveTab() {
      const { data: lecture } = await supabase
        .from('lectures')
        .select('id')
        .eq('slug' as any, lectureSlug)
        .single()

      const lectureId = lecture?.id ?? null

      if (lectureId) {
        const localTab = localStorage.getItem(`lecture:${lectureId}:active_tab`)
        if (localTab && VALID_TABS.includes(localTab)) {
          router.replace(`/${uniSlug}/${subjectSlug}/${lectureSlug}/${localTab}`)
          return
        }
      }

      if (user && lectureId) {
        const { data: resume } = await (supabase as any)
          .from('lecture_resume_state')
          .select('active_tab')
          .eq('user_id', user.id)
          .eq('lecture_id', lectureId)
          .maybeSingle()

        const savedTab = resume?.active_tab
        if (savedTab && VALID_TABS.includes(savedTab)) {
          localStorage.setItem(`lecture:${lectureId}:active_tab`, savedTab)
          router.replace(`/${uniSlug}/${subjectSlug}/${lectureSlug}/${savedTab}`)
          return
        }
      }

      router.replace(`/${uniSlug}/${subjectSlug}/${lectureSlug}/sheet`)
    }

    resolveTab()
  }, [lectureSlug, user])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '14px' }}>
      Loading...
    </div>
  )
}
