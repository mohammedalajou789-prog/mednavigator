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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">MedNavigator</span>
          <span className="text-[#64748B] text-sm">Admin Dashboard</span>
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">← Student View</Link>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-[#1E293B] text-white p-4 flex flex-col gap-1">
          {[
            { icon: '🏠', label: 'Dashboard', href: '/admin' },
            { icon: '📚', label: 'My Subjects', href: '/admin/subjects', active: true },
            { icon: '✏️', label: 'Content Builder', href: '/admin/content' },
            { icon: '👥', label: 'Subscribers', href: '/admin/subscribers' },
            { icon: '📊', label: 'Analytics', href: '/admin/analytics' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? 'bg-[#2563EB] text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0F172A]">My Subjects</h1>
            <p className="text-[#64748B] mt-1">{assignments?.length ?? 0} subjects assigned to you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!assignments || assignments.length === 0 ? (
              <div className="col-span-3 text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
                <p className="text-4xl mb-3">📚</p>
                <p className="font-medium text-[#0F172A]">No subjects assigned yet</p>
                <p className="text-sm text-[#64748B] mt-1">Contact the owner to get subjects assigned.</p>
              </div>
            ) : (
              assignments.map(a => {
                const subj = a.subjects as Record<string, unknown> | null
                const uni = a.universities as Record<string, unknown> | null
                return (
                  <Link
                    key={a.id}
                    href={`/admin/subjects/${subj?.id}`}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">📖</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        subj?.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {subj?.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors mb-1">
                      {String(subj?.name ?? '')}
                    </h3>
                    <p className="text-xs text-[#64748B] mb-3">{String(uni?.name ?? '')}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {String(subj?.subject_type ?? '')}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {String(subj?.access_mode ?? '')}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}