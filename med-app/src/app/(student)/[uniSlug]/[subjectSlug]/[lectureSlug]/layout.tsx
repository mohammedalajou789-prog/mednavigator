import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LectureSidebarShell from '@/components/student/LectureSidebarShell'
import LectureAccessTracker from '@/components/student/LectureAccessTracker'
import { LectureDataProvider } from '@/components/student/LectureDataProvider'

interface LayoutProps {
  params: Promise<{
    uniSlug: string
    subjectSlug: string
    lectureSlug: string
  }>
  children: React.ReactNode
}

interface LectureBundle {
  error?: string
  lecture?: {
    id: string
    title: string
    description: string | null
    status: string
  }
  subject?: {
    id: string
    name: string
    access_mode: string | null
    is_free: boolean | null
  }
  user_id?: string | null
  user_name?: string | null
  has_sheet?: boolean
  has_summary?: boolean
  flashcards_count?: number
  quiz_count?: number
  pyq_count?: number
  access_allowed?: boolean
}

export default async function LectureLayout({ params, children }: LayoutProps) {
  const { uniSlug, subjectSlug, lectureSlug } = await params

  const supabase = await createServerClient()

  // ── SINGLE round trip: one RPC returns everything ──────────────────────────
  const { data, error } = await supabase.rpc('get_lecture_layout_bundle' as any, {
    p_uni_slug: uniSlug,
    p_subject_slug: subjectSlug,
    p_lecture_slug: lectureSlug,
  })

  const bundle = (data as unknown as LectureBundle) ?? {}

  if (error || bundle.error === 'university_not_found') redirect('/')
  if (bundle.error === 'subject_not_found')             redirect(`/${uniSlug}`)
  if (bundle.error === 'lecture_not_found')             redirect(`/${uniSlug}/${subjectSlug}`)
  if (!bundle.lecture || !bundle.subject)               redirect('/')

  const lecture       = bundle.lecture
  const subject       = bundle.subject
  const userId        = bundle.user_id ?? null
  const userName      = bundle.user_name ?? null
  const accessAllowed = bundle.access_allowed ?? false

  const hasSheet        = bundle.has_sheet ?? false
  const hasSummary      = bundle.has_summary ?? false
  const flashcardsCount = bundle.flashcards_count ?? 0
  const quizCount       = bundle.quiz_count ?? 0
  const pyqCount        = bundle.pyq_count ?? 0

  const allTabs = [
    hasSheet            && 'sheet',
    hasSummary          && 'summary',
    flashcardsCount > 0 && 'flashcards',
    quizCount > 0       && 'quiz',
    pyqCount > 0        && 'previous-years',
  ].filter(Boolean) as string[]

  const availableTabs = allTabs.length > 0
    ? allTabs
    : ['sheet', 'summary', 'flashcards', 'quiz', 'previous-years']

  return (
    <div className="flex" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden', position: 'relative' }}>
      {/* ── CENTER: scrollable content area ── */}
      <div
        id="lecture-content-scroll"
        className="flex-1 min-w-0"
        style={{ overflowY: 'auto', height: 'calc(100vh - 72px)', background: '#F5F6FA' }}
      >
        <LectureAccessTracker lectureId={lecture.id} />
        <LectureDataProvider
          value={{
            lecture,
            subject,
            userId,
            userName,
            accessAllowed,
            availableTabs,
          }}
        >
          {children}
        </LectureDataProvider>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <LectureSidebarShell
        allTabs={availableTabs}
        uniSlug={uniSlug}
        subjectSlug={subjectSlug}
        lectureSlug={lectureSlug}
        lecture={lecture}
        subject={subject}
        userId={userId}
        userName={userName}
        accessAllowed={accessAllowed}
      />
    </div>
  )
}