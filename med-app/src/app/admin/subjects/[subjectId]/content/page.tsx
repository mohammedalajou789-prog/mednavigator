import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ subjectId: string }>
}

export default async function ContentPage({ params }: PageProps) {
  const { subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, subject_type, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, status, chapter_id, sub_subject_id, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const university = subject.universities as { name: string } | null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/subjects/${subjectId}`}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Subject
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
          {subject.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{university?.name} — Select a lecture to edit its content</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Lectures</h2>
        </div>
        {!lectures || lectures.length === 0 ? (
          <div className="px-5 py-16 text-center text-gray-500 text-sm">
            No lectures yet. Add lectures from the subject page first.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {lectures.map((lecture) => (
              <Link
                key={lecture.id}
                href={`/admin/subjects/${subjectId}/content/${lecture.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {lecture.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lecture.status === 'published'
                      ? 'bg-green-50 text-green-700'
                      : lecture.status === 'draft'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {lecture.status}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}