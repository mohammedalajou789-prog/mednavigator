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

  // Load lecture
  const { data: lecture } = await supabase
    .from('lectures')
    .select('id, title, status, subject_id, chapter_id, sub_subject_id')
    .eq('id', lectureId)
    .single()

  if (!lecture) notFound()

  // Load subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  // Load chapter or sub-subject name
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

  // Load existing content
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

  const university = subject.universities as { name: string } | null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-gray-900 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/subjects" className="hover:text-gray-900 transition-colors">My Subjects</Link>
            <span>/</span>
            <Link href={`/admin/subjects/${subjectId}`} className="hover:text-gray-900 transition-colors">
              {subject.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{lecture.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{university?.name}</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">{groupName}</span>
            <span className="text-gray-300">|</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              lecture.status === 'published'
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {lecture.status}
            </span>
          </div>
        </div>
      </div>

      {/* Content Builder */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ContentBuilder
          lectureId={lectureId}
          subjectId={subjectId}
          lectureTitle={lecture.title}
          existingSheet={sheet ?? null}
          existingSummary={summary ?? null}
        />
      </div>
    </div>
  )
}