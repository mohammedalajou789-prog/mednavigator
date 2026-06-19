import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SheetReader from '@/components/student/SheetReader'
import FlashcardsViewer from '@/components/student/FlashcardsViewer'
import QuizViewer from '@/components/student/QuizViewer'
import PreviousYearsViewer from '@/components/student/PreviousYearsViewer'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{ universityId: string; subjectId: string; lectureId: string }>
  searchParams: Promise<{ tab?: string }>
}

async function getLecture(lectureId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('lectures').select('id, title, description, status, subject_id, chapter_id, sub_subject_id').eq('id', lectureId).eq('status', 'published').single()
  return data ?? null
}

async function getLectureContent(lectureId: string) {
  const supabase = await createClient()
  const [sheet, summary, flashcards, quizQuestions, pyqs] = await Promise.all([
    supabase.from('sheets').select('*').eq('lecture_id', lectureId).eq('status', 'published').single(),
    supabase.from('summaries').select('*').eq('lecture_id', lectureId).eq('status', 'published').single(),
    supabase.from('flashcards').select('*').eq('lecture_id', lectureId).order('display_order'),
    supabase.from('quiz_questions').select('*').eq('lecture_id', lectureId).order('created_at'),
    supabase.from('previous_year_questions').select('*').eq('lecture_id', lectureId).order('exam_year', { ascending: false }),
  ])
  return {
    sheet: sheet.data ?? null,
    summary: summary.data ?? null,
    flashcards: flashcards.data ?? [],
    quizQuestions: quizQuestions.data ?? [],
    pyqs: pyqs.data ?? [],
  }
}

async function getBreadcrumb(lecture: { chapter_id: string | null; sub_subject_id: string | null }, subjectId: string) {
  const supabase = await createClient()
  const { data: subject } = await supabase.from('subjects').select('name').eq('id', subjectId).single()
  let groupName = null
  if (lecture.chapter_id) {
    const { data } = await supabase.from('chapters').select('title').eq('id', lecture.chapter_id).single()
    groupName = data?.title ?? null
  } else if (lecture.sub_subject_id) {
    const { data } = await supabase.from('sub_subjects').select('title').eq('id', lecture.sub_subject_id).single()
    groupName = data?.title ?? null
  }
  return { subjectName: subject?.name ?? 'Subject', groupName }
}

const TABS = [
  { key: 'sheet', label: 'Sheet' },
  { key: 'summary', label: 'Summary' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'previous-years', label: 'Previous Years' },
] as const

export default async function LectureHubPage({ params, searchParams }: PageProps) {
  const { universityId, subjectId, lectureId } = await params
  const { tab = 'sheet' } = await searchParams

  const lecture = await getLecture(lectureId)
  if (!lecture) notFound()

  const [content, breadcrumb] = await Promise.all([
    getLectureContent(lectureId),
    getBreadcrumb(lecture, subjectId),
  ])

  const availableTabs = TABS.filter((t) => {
    if (t.key === 'sheet') return !!content.sheet
    if (t.key === 'summary') return !!content.summary
    if (t.key === 'flashcards') return content.flashcards.length > 0
    if (t.key === 'quiz') return content.quizQuestions.length > 0
    if (t.key === 'previous-years') return content.pyqs.length > 0
    return false
  })

  const activeTab = availableTabs.find((t) => t.key === tab)?.key ?? availableTabs[0]?.key ?? 'sheet'

  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <Link href={`/${universityId}`} className="hover:text-blue-600 transition-colors">Subjects</Link>
          <span>/</span>
          <Link href={`/${universityId}/${subjectId}`} className="hover:text-blue-600 transition-colors">{breadcrumb.subjectName}</Link>
          {breadcrumb.groupName && <><span>/</span><span>{breadcrumb.groupName}</span></>}
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300">{lecture.title}</span>
        </nav>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{lecture.title}</h1>
        {availableTabs.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {availableTabs.map((t) => (
              <Link key={t.key} href={`/${universityId}/${subjectId}/${lectureId}?tab=${t.key}`}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                  activeTab === t.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400')}>
                {t.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {availableTabs.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p className="text-sm">No content available for this lecture yet.</p>
          </div>
        ) : (
          <>
            {activeTab === 'sheet' && content.sheet && <SheetReader content={content.sheet.content ?? ''} title={content.sheet.title} />}
            {activeTab === 'summary' && content.summary && <SheetReader content={content.summary.content ?? ''} title={content.summary.title} isSummary />}
            {activeTab === 'flashcards' && <FlashcardsViewer flashcards={content.flashcards} />}
            {activeTab === 'quiz' && <QuizViewer questions={content.quizQuestions} />}
            {activeTab === 'previous-years' && <PreviousYearsViewer questions={content.pyqs} />}
          </>
        )}
      </div>
    </div>
  )
}