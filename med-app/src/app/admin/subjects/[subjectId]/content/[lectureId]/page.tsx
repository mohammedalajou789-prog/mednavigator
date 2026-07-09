import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ContentBuilder from '@/components/admin/ContentBuilder'

interface Props {
  params: Promise<{ subjectId: string; lectureId: string }>
}

export default async function ContentBuilderPage({ params }: Props) {
  const { subjectId, lectureId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    redirect('/login')
  }

  const { data: lecture } = await supabase
    .from('lectures')
    .select('id, title, status, subject_id, chapter_id, sub_subject_id')
    .eq('id', lectureId)
    .single()

  if (!lecture) notFound()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, subject_type, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  let groupName = ''
  if (lecture.chapter_id) {
    const { data: chapter } = await supabase
      .from('chapters')
      .select('title')
      .eq('id', lecture.chapter_id)
      .single()
    groupName = chapter?.title ?? ''
  } else if (lecture.sub_subject_id) {
    const { data: sub } = await supabase
      .from('sub_subjects')
      .select('title')
      .eq('id', lecture.sub_subject_id)
      .single()
    groupName = sub?.title ?? ''
  }

  const { data: sheet } = await supabase
    .from('sheets')
    .select('id, title, content, status, version')
    .eq('lecture_id', lectureId)
    .maybeSingle()

  const { data: summary } = await supabase
    .from('summaries')
    .select('id, title, content, status, version')
    .eq('lecture_id', lectureId)
    .maybeSingle()

  const [
    { data: flashcards },
    { data: quizQuestions },
    { data: pyqs },
    { data: videos },
    { data: clinicalModules },
    { data: sheetImageSlots },
    { data: summaryImageSlots },
  ] = await Promise.all([
    supabase.from('flashcards').select('id, front_text, back_text, tags').eq('lecture_id', lectureId).order('display_order'),
    supabase.from('quiz_questions').select('id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, tags').eq('lecture_id', lectureId),
    supabase.from('previous_year_questions').select('id, question, options, correct_answer, explanation, exam_year, exam_type, batch_name').eq('lecture_id', lectureId),
    supabase.from('videos').select('id, title, description, video_url, is_preview, display_order').eq('lecture_id', lectureId).order('display_order'),
    supabase.from('clinical_modules').select('id, module_type, clinical_topics(id, title, description, display_order, clinical_sheets(id, title, content))').eq('subject_id', subjectId).is('archived_at', null),
    sheet?.id
      ? supabase.from('image_slots').select('slot_number, media_library(file_url)').eq('entity_type', 'sheet').eq('entity_id', sheet.id)
      : Promise.resolve({ data: [] as any[] }),
    summary?.id
      ? supabase.from('image_slots').select('slot_number, media_library(file_url)').eq('entity_type', 'summary').eq('entity_id', summary.id)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const sheetImages: Record<number, string> = {}
  for (const row of sheetImageSlots ?? []) {
    const url = (row.media_library as any)?.file_url
    if (url) sheetImages[row.slot_number] = url
  }

  const summaryImages: Record<number, string> = {}
  for (const row of summaryImageSlots ?? []) {
    const url = (row.media_library as any)?.file_url
    if (url) summaryImages[row.slot_number] = url
  }

  const isClinic = subject?.subject_type === 'clinical'
  const university = subject.universities as { name: string } | null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/subjects" className="hover:text-gray-900 dark:hover:text-white transition-colors">My Subjects</Link>
            <span>/</span>
            <Link href={`/admin/subjects/${subjectId}`} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              {subject.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{lecture.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{university?.name}</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">{groupName}</span>
            <span className="text-gray-300">|</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              lecture.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {lecture.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <ContentBuilder
          lectureId={lectureId}
          subjectId={subjectId}
          lectureTitle={lecture.title}
          existingSheet={sheet ?? null}
          existingSummary={summary ?? null}
          existingFlashcards={(flashcards ?? []).map(f => ({
            ...f,
            tags: f.tags ?? [],
          }))}
          existingQuizQuestions={(quizQuestions ?? []).map(q => ({
            ...q,
            tags: q.tags ?? [],
          })) as any}
          existingPYQs={(pyqs ?? []).map(q => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : [],
            exam_year: q.exam_year ?? '',
          })) as any}
          existingVideos={(videos ?? []).map(v => ({
            ...v,
            is_preview: v.is_preview ?? false,
            display_order: v.display_order ?? 0,
          }))}
          isClinic={isClinic}
          existingModules={(clinicalModules ?? []) as any}
          existingSheetImages={sheetImages}
          existingSummaryImages={summaryImages}
        />
      </div>
    </div>
  )
}