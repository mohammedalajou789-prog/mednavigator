import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentHomePage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(id, name, logo_url)')
    .eq('auth_user_id', user.id)
    .single()

  const { data: subscriptions } = await supabase
    .from('subject_subscriptions')
    .select('*, subjects(id, name, subject_type, access_mode, university_id)')
    .eq('user_id', profile?.id)
    .eq('status', 'active')

  const { data: pinnedRows } = await supabase
    .from('pinned_subjects')
    .select('*, subjects(id, name, subject_type, access_mode, university_id, universities(name))')
    .eq('user_id', profile?.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'
  const universityId = profile?.default_university_id
  const university = profile?.universities as Record<string, unknown> | null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Welcome back, {firstName} 👋</h1>
        {university && <p className="text-[#64748B] mt-1">{String(university.name)}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Active Subjects</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1">{subscriptions?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Bookmarks</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1">{bookmarkCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Pinned Subjects</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1">{pinnedRows?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">My University</p>
          <p className="text-sm font-semibold text-[#0F172A] mt-2">{university ? String(university.name) : '—'}</p>
          {universityId && (
            <Link href={`/${universityId}`} className="text-xs text-[#2563EB] mt-1 block hover:underline">Browse subjects →</Link>
          )}
        </div>
      </div>

      {pinnedRows && pinnedRows.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">📌 Pinned Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedRows.map((row) => {
              const subj = row.subjects as Record<string, unknown> | null
              if (!subj) return null
              const uni = subj.universities as Record<string, unknown> | null
              return (
                <Link
                  key={row.id}
                  href={`/${subj.university_id}/${subj.id}`}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">📚</div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      subj.subject_type === 'standard' ? 'bg-blue-100 text-blue-700' :
                      subj.subject_type === 'system' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>{String(subj.subject_type)}</span>
                  </div>
                  <h3 className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{String(subj.name)}</h3>
                  {uni && <p className="text-xs text-[#64748B] mt-1">{String(uni.name)}</p>}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {subscriptions && subscriptions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A]">🎓 Active Subscriptions</h2>
            <Link href="/subscriptions" className="text-sm text-[#2563EB] hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => {
              const subj = sub.subjects as Record<string, unknown> | null
              const expiry = new Date(sub.end_date)
              const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div key={sub.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#0F172A] text-sm">{String(subj?.name ?? '')}</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className={`text-xs font-medium ${daysLeft <= 7 ? 'text-amber-600' : 'text-[#64748B]'}`}>
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                  </p>
                  <div className="mt-2 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${Math.min(100, Math.max(0, (daysLeft / 60) * 100))}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🏫', label: 'My Subjects', href: universityId ? `/${universityId}` : '/' },
            { icon: '🔖', label: 'Bookmarks', href: '/bookmarks' },
            { icon: '🔔', label: 'Notifications', href: '/notifications' },
            { icon: '👤', label: 'Profile', href: '/profile' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all text-center group"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium text-[#64748B] group-hover:text-[#2563EB] transition-colors">{item.label}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}