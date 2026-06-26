import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function AdminSubjectDetailPage({ params }: Props) {
  const { subjectId } = await params
  const profile = await requireAuth()

  if (profile.role !== 'admin' && profile.role !== 'owner') redirect('/login')

  const supabase = await createServerClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, subject_type, is_published, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const university = subject.universities as { name: string } | null
  const isSystemSubject = subject.subject_type === 'system'

  const [groupsResult, lecturesResult] = await Promise.all([
    isSystemSubject
      ? supabase.from('sub_subjects').select('id, title, display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order')
      : supabase.from('chapters').select('id, title, display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('lectures').select('id, title, status, chapter_id, sub_subject_id, display_order').eq('subject_id', subjectId).order('display_order'),
  ])

  const groups = groupsResult.data ?? []
  const allLectures = lecturesResult.data ?? []

  const groupsWithLectures = groups.map(group => ({
    ...group,
    lectures: allLectures.filter(l =>
      isSystemSubject ? l.sub_subject_id === group.id : l.chapter_id === group.id
    ),
  }))

  const totalLectures = allLectures.length
  const publishedLectures = allLectures.filter(l => l.status === 'published').length

  const addGroupUrl = isSystemSubject
    ? `/admin/subjects/${subjectId}/sub-subjects/new`
    : `/admin/subjects/${subjectId}/chapters/new`

  const addGroupLabel = isSystemSubject ? '+ Add Sub-Subject' : '+ Add Chapter'

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/subjects" className="hover:text-gray-900 dark:hover:text-white transition-colors">My Subjects</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{subject.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">{university?.name}</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{subject.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {subject.subject_type}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              subject.is_published
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {subject.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        <Link
          href={addGroupUrl}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {addGroupLabel}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">{isSystemSubject ? 'Sub-Subjects' : 'Chapters'}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{groups.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Lectures</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{totalLectures}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{publishedLectures}</p>
        </div>
      </div>

      {/* Groups */}
      {groupsWithLectures.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">
            No {isSystemSubject ? 'sub-subjects' : 'chapters'} yet.
          </p>
          <Link
            href={addGroupUrl}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {addGroupLabel}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groupsWithLectures.map((group) => (
            <div key={group.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-medium text-gray-900 dark:text-white">{group.title}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{group.lectures.length} lectures</span>
                  <Link
                    href={`/admin/subjects/${subjectId}/lectures/new?${isSystemSubject ? 'sub_subject_id' : 'chapter_id'}=${group.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    + Add Lecture
                  </Link>
                </div>
              </div>

              {group.lectures.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  No lectures yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {group.lectures.map((lecture) => (
                    <div key={lecture.id} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{lecture.title}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          lecture.status === 'published'
                            ? 'bg-green-50 text-green-700'
                            : lecture.status === 'archived'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {lecture.status}
                        </span>
                        <Link
                          href={`/admin/subjects/${subjectId}/content/${lecture.id}`}
                          className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
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