import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Subject } from '@/types/database'
import SubjectCard from '@/components/student/SubjectCard'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{ universityId: string; subjectId: string }>
}

async function getSubject(subjectId: string, universityId: string): Promise<Subject | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('*').eq('id', subjectId).eq('university_id', universityId).eq('is_active', true).single()
  return data ?? null
}

async function getChaptersWithLectures(subjectId: string) {
  const supabase = await createClient()
  const { data: chapters } = await supabase.from('chapters').select('*').eq('subject_id', subjectId).is('archived_at', null).order('display_order')
  if (!chapters || chapters.length === 0) return []
  const chapterIds = chapters.map((c) => c.id)
  const { data: lectures } = await supabase.from('lectures').select('id, title, status, display_order, chapter_id, subject_id').in('chapter_id', chapterIds).eq('status', 'published').order('display_order')
  return chapters.map((chapter) => ({ ...chapter, lectures: (lectures ?? []).filter((l) => l.chapter_id === chapter.id) }))
}

async function getSubSubjectsWithLectures(subjectId: string) {
  const supabase = await createClient()
  const { data: subSubjects } = await supabase.from('sub_subjects').select('*').eq('subject_id', subjectId).is('archived_at', null).order('display_order')
  if (!subSubjects || subSubjects.length === 0) return []
  const subIds = subSubjects.map((s) => s.id)
  const { data: lectures } = await supabase.from('lectures').select('id, title, status, display_order, sub_subject_id, subject_id').in('sub_subject_id', subIds).eq('status', 'published').order('display_order')
  return subSubjects.map((sub) => ({ ...sub, lectures: (lectures ?? []).filter((l) => l.sub_subject_id === sub.id) }))
}

async function getLectureContentFlags(lectureIds: string[]) {
  if (lectureIds.length === 0) return {}
  const supabase = await createClient()
  const [sheets, summaries, flashcards, quizzes, pyqs] = await Promise.all([
    supabase.from('sheets').select('lecture_id').in('lecture_id', lectureIds).eq('status', 'published'),
    supabase.from('summaries').select('lecture_id').in('lecture_id', lectureIds).eq('status', 'published'),
    supabase.from('flashcards').select('lecture_id').in('lecture_id', lectureIds),
    supabase.from('quiz_questions').select('lecture_id').in('lecture_id', lectureIds),
    supabase.from('previous_year_questions').select('lecture_id').in('lecture_id', lectureIds),
  ])
  const flags: Record<string, { sheet: boolean; summary: boolean; flashcards: boolean; quiz: boolean; pyq: boolean }> = {}
  for (const id of lectureIds) {
    flags[id] = {
      sheet: (sheets.data ?? []).some((r) => r.lecture_id === id),
      summary: (summaries.data ?? []).some((r) => r.lecture_id === id),
      flashcards: (flashcards.data ?? []).some((r) => r.lecture_id === id),
      quiz: (quizzes.data ?? []).some((r) => r.lecture_id === id),
      pyq: (pyqs.data ?? []).some((r) => r.lecture_id === id),
    }
  }
  return flags
}

function ContentBadge({ label, color }: { label: string; color: string }) {
  return <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', color)}>{label}</span>
}

function LectureRow({ lecture, universityId, subjectId, flags }: { lecture: { id: string; title: string }; universityId: string; subjectId: string; flags: { sheet: boolean; summary: boolean; flashcards: boolean; quiz: boolean; pyq: boolean } }) {
  return (
    <Link href={`/${universityId}/${subjectId}/${lecture.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{lecture.title}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
        {flags.sheet && <ContentBadge label="Sheet" color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300" />}
        {flags.summary && <ContentBadge label="Summary" color="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300" />}
        {flags.flashcards && <ContentBadge label="Flashcards" color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300" />}
        {flags.quiz && <ContentBadge label="Quiz" color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300" />}
        {flags.pyq && <ContentBadge label="PYQ" color="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300" />}
        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  )
}

export default async function SubjectPage({ params }: PageProps) {
  const { universityId, subjectId } = await params
  const subject = await getSubject(subjectId, universityId)
  if (!subject) notFound()

  const isSystem = subject.subject_type === 'system'
  const groups = isSystem ? await getSubSubjectsWithLectures(subjectId) : await getChaptersWithLectures(subjectId)
  const allLectureIds = groups.flatMap((g) => g.lectures.map((l: { id: string }) => l.id))
  const contentFlags = await getLectureContentFlags(allLectureIds)

  const TYPE_COLORS: Record<string, string> = {
    standard: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    system: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    clinical: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  }
  const ACCESS_COLORS: Record<string, string> = {
    free: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    premium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    mixed: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  }

  const typeLabel = { standard: 'Standard', system: 'System', clinical: 'Clinical' }[subject.subject_type] ?? subject.subject_type
  const accessLabel = { free: 'Free', premium: 'Premium', mixed: 'Mixed' }[subject.access_mode] ?? 'Free'
  const groupLabel = isSystem ? 'sub-subject' : 'chapter'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href={`/${universityId}`} className="hover:text-blue-600 transition-colors">Subjects</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300">{subject.name}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[subject.subject_type] ?? TYPE_COLORS.standard)}>{typeLabel}</span>
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', ACCESS_COLORS[subject.access_mode] ?? ACCESS_COLORS.free)}>{accessLabel}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{subject.name}</h1>
            {subject.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">{subject.description}</p>}
          </div>
          {subject.access_mode === 'premium' && (
            <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center min-w-[160px]">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Access required</p>
              {subject.price > 0 && <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{subject.price} JOD</p>}
              <p className="text-xs text-amber-500 mt-1">Contact support to subscribe</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">{groups.length} {groupLabel}{groups.length !== 1 ? 's' : ''} · {allLectureIds.length} lecture{allLectureIds.length !== 1 ? 's' : ''}</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="text-sm">No content available yet.</p></div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{group.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{group.lectures.length} lecture{group.lectures.length !== 1 ? 's' : ''}</p>
              </div>
              {group.lectures.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-400">No lectures yet.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {group.lectures.map((lecture: { id: string; title: string }) => (
                    <LectureRow key={lecture.id} lecture={lecture} universityId={universityId} subjectId={subjectId} flags={contentFlags[lecture.id] ?? { sheet: false, summary: false, flashcards: false, quiz: false, pyq: false }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}