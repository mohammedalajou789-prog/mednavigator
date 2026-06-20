import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AddSubSubjectForm from '@/components/admin/AddSubSubjectForm'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function NewSubSubjectPage({ params }: Props) {
  const { subjectId } = await params
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
    .select('id, name, subject_type, university_id, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  if (subject.subject_type !== 'system') {
    redirect(`/admin/subjects/${subjectId}/chapters/new`)
  }

  const university = subject.universities as { name: string } | null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
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
        <span className="text-gray-900 font-medium">New Sub-Subject</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {university?.name}
          </span>
          <span className="text-xs text-gray-400">→</span>
          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            {subject.name}
          </span>
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            System Subject
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">Add New Sub-Subject</h1>
        <p className="text-sm text-gray-500 mt-1">
          System subjects use Sub-Subjects instead of Chapters. For example: Heart Failure, Valvular Disease, Arrhythmias.
        </p>
      </div>

      <AddSubSubjectForm subjectId={subjectId} />
    </div>
  )
}