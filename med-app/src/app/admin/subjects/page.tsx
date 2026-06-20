import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminSubjectsPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/')

  const { data: assignments } = await supabase
    .from('admin_assignments')
    .select('*, subjects(id, name, subject_type, category, access_mode, is_published, updated_at), universities(id, name)')
    .eq('user_id', profile.id)
    .eq('is_active', true)

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Subjects</h1>
        <p className="text-gray-500 mt-1">{assignments?.length ?? 0} subjects assigned to you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!assignments || assignments.length === 0 ? (
          <div className="col-span-3 text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-medium text-gray-900 dark:text-white">No subjects assigned yet</p>
            <p className="text-sm text-gray-500 mt-1">Contact the owner to get subjects assigned.</p>
          </div>
        ) : (
          assignments.map(a => {
            const subj = a.subjects as Record<string, unknown> | null
            const uni = a.universities as Record<string, unknown> | null
            return (
              <Link
                key={a.id}
                href={`/admin/subjects/${subj?.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-blue-600 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xl">📖</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    subj?.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {subj?.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1">
                  {String(subj?.name ?? '')}
                </h3>
                <p className="text-xs text-gray-500 mb-3">{String(uni?.name ?? '')}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 px-2 py-0.5 rounded-full">
                    {String(subj?.subject_type ?? '')}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {String(subj?.access_mode ?? '')}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}