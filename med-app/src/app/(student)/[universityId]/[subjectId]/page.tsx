import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ universityId: string; subjectId: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { universityId, subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    userId = profile?.id ?? null
  }

  const { data: university } = await supabase
    .from('universities')
    .select('id, name')
    .eq('id', universityId)
    .single()

  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .eq('is_published', true)
    .single()

  if (!subject || !university) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const { data: subSubjects } = await supabase
    .from('sub_subjects')
    .select('id, title, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, chapter_id, sub_subject_id, is_preview')
    .eq('subject_id', subjectId)
    .eq('status', 'published')
    .order('display_order')

  // Progress tracking
  let progressData: { lecture_id: string; completed: boolean; content_type: string; last_accessed_at: string }[] = []
  let continueReading: { lecture_id: string; content_type: string; last_accessed_at: string } | null = null

  if (userId && lectures && lectures.length > 0) {
    const lectureIds = lectures.map(l => l.id)

    const { data: progress } = await supabase
      .from('user_progress')
      .select('lecture_id, completed, content_type, last_accessed_at')
      .eq('user_id', userId)
      .in('lecture_id', lectureIds)

    progressData = progress ?? []

    // Find the most recently accessed lecture for Continue Reading
    const sorted = [...progressData].sort(
      (a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
    )
    continueReading = sorted[0] ?? null
  }

  const totalLectures = lectures?.length ?? 0
  const completedCount = progressData.filter(p => p.completed).length
  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0

  const isSystem = subject.subject_type === 'system'
  const groups = isSystem ? subSubjects ?? [] : chapters ?? []

  function getLectureProgress(lectureId: string) {
    return progressData.find(p => p.lecture_id === lectureId)
  }

  const continueReadingLecture = continueReading
    ? lectures?.find(l => l.lecture_id === continueReading?.lecture_id) ??
      lectures?.find(l => l.id === continueReading?.lecture_id)
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
        <Link href="/" className="hover:text-[#2563EB]">Home</Link>
        <span>/</span>
        <Link href={`/${universityId}`} className="hover:text-[#2563EB]">{university.name}</Link>
        <span>/</span>
        <span className="text-[#0F172A] font-medium">{subject.name}</span>
      </div>

      {/* Subject Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-700 p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            subject.subject_type === 'standard' ? 'bg-blue-100 text-blue-700' :
            subject.subject_type === 'system' ? 'bg-purple-100 text-purple-700' :
            'bg-green-100 text-green-700'
          }`}>
            {subject.subject_type}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            subject.access_mode === 'free' ? 'bg-green-100 text-green-700' :
            subject.access_mode === 'mixed' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {subject.access_mode === 'free' ? 'Free' : subject.access_mode === 'mixed' ? 'Mixed' : 'Premium'}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-white">{subject.name}</h1>
        {subject.description && <p className="text-[#64748B] mt-2">{subject.description}</p>}
        <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
          <p className="text-sm text-[#64748B]">
            {totalLectures} Lectures · {groups.length} {isSystem ? 'Sub-Subjects' : 'Chapters'}
          </p>
          <Link
            href={`/${universityId}/${subjectId}/previous-years`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
          >
            <span>📅</span>
            Previous Years Bank
          </Link>
        </div>

        {/* Progress Bar */}
        {userId && totalLectures > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#64748B]">Your Progress</span>
              <span className="text-sm font-semibold text-[#2563EB]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div
                className="bg-[#2563EB] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-[#64748B] mt-1">{completedCount} of {totalLectures} lectures completed</p>
          </div>
        )}
      </div>

      {/* Continue Reading */}
      {continueReadingLecture && continueReading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Continue Reading</p>
            <p className="font-medium text-[#0F172A] dark:text-white">{continueReadingLecture.title}</p>
            <p className="text-xs text-[#64748B] capitalize">{continueReading.content_type.replace('_', ' ')}</p>
          </div>
          <Link
            href={`/${universityId}/${subjectId}/${continueReadingLecture.id}`}
            className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            Resume →
          </Link>
        </div>
      )}

      {/* Chapters / Sub-Subjects */}
      <div className="space-y-4">
        {groups.map(group => {
          const groupLectures = lectures?.filter(l =>
            isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id
          ) ?? []

          return (
            <div key={group.id} className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-gray-700 bg-[#F8FAFC] dark:bg-gray-800">
                <h2 className="font-semibold text-[#0F172A] dark:text-white">{group.title}</h2>
                <p className="text-sm text-[#64748B]">{groupLectures.length} lectures</p>
              </div>
              <div className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
                {groupLectures.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-[#64748B]">No lectures yet.</div>
                ) : (
                  groupLectures.map(lecture => {
                    const lp = getLectureProgress(lecture.id)
                    return (
                      <Link
                        key={lecture.id}
                        href={`/${universityId}/${subjectId}/${lecture.id}`}
                        className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] dark:hover:bg-gray-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                            lp?.completed ? 'bg-green-100' : 'bg-blue-50 dark:bg-blue-900/20'
                          }`}>
                            {lp?.completed ? '✅' : '📖'}
                          </div>
                          <div>
                            <span className="font-medium text-[#0F172A] dark:text-white group-hover:text-[#2563EB] transition-colors">
                              {lecture.title}
                            </span>
                            {lp && !lp.completed && (
                              <p className="text-xs text-[#64748B] capitalize">
                                In progress · {lp.content_type.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                          {lecture.is_preview && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Preview</span>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="text-center py-20 text-[#64748B]">
            <p>No content available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}