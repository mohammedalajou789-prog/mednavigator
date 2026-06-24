import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminHomePage() {
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
    .select('*, subjects(id, name, subject_type, is_published), universities(id, name)')
    .eq('user_id', profile.id)
    .eq('is_active', true)

  const { data: recentSheets } = await supabase
    .from('sheets')
    .select('id, title, status, updated_at, lectures(title)')
    .eq('updated_by', profile.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  const publishedCount = assignments?.filter(a => (a.subjects as Record<string, unknown>)?.is_published).length ?? 0
  const draftCount = (assignments?.length ?? 0) - publishedCount

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {profile?.full_name?.split(' ')[0]}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Assigned Subjects', value: assignments?.length ?? 0, color: 'text-blue-600' },
          { label: 'Published', value: publishedCount, color: 'text-green-600' },
          { label: 'Draft', value: draftCount, color: 'text-amber-600' },
          { label: 'Recent Updates', value: recentSheets?.length ?? 0, color: 'text-purple-600' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* My Subjects */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">My Subjects</h2>
          <Link href="/admin/subjects" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {!assignments || assignments.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500">
              <p>No subjects assigned yet.</p>
            </div>
          ) : (
            assignments.map(a => {
              const subj = a.subjects as Record<string, unknown> | null
              const uni = a.universities as Record<string, unknown> | null
              return (
                <Link
                  key={a.id}
                  href={`/admin/subjects/${subj?.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {String(subj?.name ?? '')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{String(uni?.name ?? '')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      subj?.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {subj?.is_published ? 'Published' : 'Draft'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentSheets && recentSheets.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Updates</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentSheets.map(sheet => {
              const lecture = sheet.lectures as Record<string, unknown> | null
              return (
                <div key={sheet.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{sheet.title}</p>
                    <p className="text-xs text-gray-500">{String(lecture?.title ?? '')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sheet.status === 'published' ? 'bg-green-100 text-green-700' :
                      sheet.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {sheet.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {sheet.updated_at ? new Date(sheet.updated_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}