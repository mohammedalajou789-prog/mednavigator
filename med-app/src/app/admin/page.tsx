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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">MedNavigator</span>
          <span className="text-[#64748B] text-sm">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{profile?.full_name}</span>
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">← Student View</Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-[#1E293B] text-white p-4 flex flex-col gap-1">
          {[
            { icon: '🏠', label: 'Dashboard', href: '/admin', active: true },
            { icon: '📚', label: 'My Subjects', href: '/admin/subjects' },
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
            <h1 className="text-2xl font-semibold text-[#0F172A]">Dashboard</h1>
            <p className="text-[#64748B] mt-1">Welcome back, {profile?.full_name?.split(' ')[0]}</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Assigned Subjects', value: assignments?.length ?? 0, color: 'text-blue-600' },
              { label: 'Published', value: publishedCount, color: 'text-green-600' },
              { label: 'Draft', value: draftCount, color: 'text-amber-600' },
              { label: 'Recent Updates', value: recentSheets?.length ?? 0, color: 'text-purple-600' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
                <p className="text-sm text-[#64748B]">{card.label}</p>
                <p className={`text-3xl font-semibold mt-1 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* My Subjects */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm mb-6">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="font-semibold text-[#0F172A]">My Subjects</h2>
              <Link href="/admin/subjects" className="text-sm text-[#2563EB] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {!assignments || assignments.length === 0 ? (
                <div className="px-5 py-8 text-center text-[#64748B]">
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
                      className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                          {String(subj?.name ?? '')}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">{String(uni?.name ?? '')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          subj?.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {subj?.is_published ? 'Published' : 'Draft'}
                        </span>
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0F172A]">Recent Updates</h2>
              </div>
              <div className="divide-y divide-[#E2E8F0]">
                {recentSheets.map(sheet => {
                  const lecture = sheet.lectures as Record<string, unknown> | null
                  return (
                    <div key={sheet.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{sheet.title}</p>
                        <p className="text-xs text-[#64748B]">{String(lecture?.title ?? '')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sheet.status === 'published' ? 'bg-green-100 text-green-700' :
                          sheet.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {sheet.status}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {new Date(sheet.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}