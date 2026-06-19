import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ContentBuilder from '@/components/admin/ContentBuilder'

interface PageProps {
  params: Promise<{ subjectId: string }>
}

export default async function ContentBuilderPage({ params }: PageProps) {
  const { subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/')

  const { data: subject } = await supabase
    .from('subjects')
    .select('*, universities(id, name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

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
    .select('id, title, status, chapter_id, sub_subject_id, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const isSystem = subject.subject_type === 'system'
  const university = subject.universities as Record<string, unknown> | null

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-[#1E293B] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-blue-400">MedNavigator</span>
          <span className="text-[#64748B] text-sm">/</span>
          <span className="text-sm text-gray-300">Content Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/subjects/${subjectId}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Subject
          </Link>
        </div>
      </div>

      <ContentBuilder
        subject={subject}
        universityName={String(university?.name ?? '')}
        chapters={chapters ?? []}
        subSubjects={subSubjects ?? []}
        lectures={lectures ?? []}
        isSystem={isSystem}
        userId={profile.id}
      />
    </div>
  )
}