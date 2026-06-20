import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AddLectureForm from '@/components/admin/AddLectureForm'
import { getChaptersBySubject } from '@/lib/services/chapters'
import { getSubSubjectsBySubject } from '@/lib/services/sub-subjects'

interface Props {
  params: Promise<{ subjectId: string }>
  searchParams: Promise<{ chapter_id?: string; sub_subject_id?: string }>
}

export default async function NewLecturePage({ params, searchParams }: Props) {
  const { subjectId } = await params
  const { chapter_id, sub_subject_id } = await searchParams

  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    redirect('/login')
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, subject_type, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const isSystemSubject = subject.subject_type === 'system'
  const university = subject.universities as { name: string } | null

  const chapters = isSystemSubject ? [] : (await getChaptersBySubject(subjectId)).data ?? []
  const subSubjects = isSystemSubject ? (await getSubSubjectsBySubject(subjectId)).data ?? [] : []

  if (!isSystemSubject && chapters.length === 0) {
    redirect(`/admin/subjects/${subjectId}/chapters/new`)
  }
  if (isSystemSubject && subSubjects.length === 0) {
    redirect(`/admin/subjects/${subjectId}/sub-subjects/new`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link href="/admin" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/subjects" className="hover:text-gray-900 transition-colors">
          My Subjects
        </Link>
        <span>/</span>
        <Link href={`/admin/subjects/${subjectId}`} className="hover:text-gray-900 transition-colors">
          {subject.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Lecture</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {university?.name}
          </span>
          <span className="text-xs text-gray-400">→</span>
          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            {subject.name}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">Add New Lecture</h1>
        <p className="text-sm text-gray-500 mt-1">
          After creating a lecture, you can add a Sheet, Summary, Flashcards, Quiz, or Previous Year Questions inside it.
        </p>
      </div>

      <AddLectureForm
        subjectId={subjectId}
        subjectType={subject.subject_type as 'standard' | 'system' | 'clinical'}
        chapters={chapters}
        subSubjects={subSubjects}
        defaultChapterId={chapter_id}
        defaultSubSubjectId={sub_subject_id}
      />
    </div>
  )
}