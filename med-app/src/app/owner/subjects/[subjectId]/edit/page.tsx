import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditSubjectForm from '@/components/owner/EditSubjectForm'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function EditSubjectPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/owner')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, description, subject_type, category, access_mode, price, is_published, is_active, university_id, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const university = subject.universities as { name: string } | null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/owner" className="hover:text-gray-900 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/owner/subjects" className="hover:text-gray-900 transition-colors">Subjects</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit — {subject.name}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {university?.name}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Edit Subject</h1>
        <p className="text-sm text-gray-500 mt-1">
          Changes will apply immediately to all students accessing this subject.
        </p>
      </div>

      <EditSubjectForm
        subject={{
          id: subject.id,
          name: subject.name,
          description: subject.description ?? '',
          subject_type: subject.subject_type,
          category: subject.category ?? '',
          access_mode: subject.access_mode ?? 'free',
          price: subject.price ?? 0,
          is_published: subject.is_published ?? false,
          is_active: subject.is_active ?? true,
          university_id: subject.university_id,
        }}
        universities={universities ?? []}
      />
    </div>
  )
}