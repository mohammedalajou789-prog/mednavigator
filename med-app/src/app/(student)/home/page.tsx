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

      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🏫', label: 'My Subjects', href: universityId ? `/${universityId}` : '/home' },
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