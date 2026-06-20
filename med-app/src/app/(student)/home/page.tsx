import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllUniversities } from '@/lib/services/universities'

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

  const { data: universities } = await getAllUniversities()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student'
  const universityId = profile?.default_university_id
  const university = profile?.universities as { id: string; name: string; logo_url?: string } | null
  const hasUniversity = !!universityId && !!university

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-white">
          Welcome back, {firstName} 👋
        </h1>
        {hasUniversity ? (
          <p className="text-[#64748B] mt-1">{university.name}</p>
        ) : (
          <p className="text-[#64748B] mt-1">Select a university to start browsing</p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Active Subjects</p>
          <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1">
            {subscriptions?.length ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Bookmarks</p>
          <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1">
            {bookmarkCount ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Pinned Subjects</p>
          <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1">
            {pinnedRows?.length ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">My University</p>
          {hasUniversity ? (
            <>
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white mt-2 truncate">
                {university.name}
              </p>
              <Link
                href={`/${universityId}`}
                className="text-xs text-[#2563EB] mt-1 block hover:underline"
              >
                Browse subjects →
              </Link>
            </>
          ) : (
            <p className="text-sm text-[#64748B] mt-2">Not assigned yet</p>
          )}
        </div>
      </div>

      {/* University Section */}
      {hasUniversity ? (
        // Student has a university — show quick access to their subjects
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
              My University
            </h2>
            <Link
              href={`/${universityId}`}
              className="text-sm text-[#2563EB] hover:underline"
            >
              View all subjects →
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
              {university.logo_url ? (
                <img src={university.logo_url} alt={university.name} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-blue-600 text-lg font-bold">
                  {university.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#0F172A] dark:text-white">{university.name}</p>
              <p className="text-sm text-[#64748B] mt-0.5">Your registered university</p>
            </div>
            <Link
              href={`/${universityId}`}
              className="px-4 py-2 bg-[#2563EB] text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              Browse Subjects
            </Link>
          </div>
        </section>
      ) : (
        // Student has NO university — show university selector
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white">
              Browse Universities
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Your university is not assigned yet. Select any university below to start browsing its content.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universities && universities.length > 0 ? (
              universities.map((uni) => (
                <Link
                  key={uni.id}
                  href={`/${uni.id}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    {uni.logo_url ? (
                      <img src={uni.logo_url} alt={uni.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="text-blue-600 text-sm font-bold">
                        {uni.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#0F172A] dark:text-white text-sm truncate">
                      {uni.name}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">Browse subjects →</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-[#64748B] text-sm">
                No universities available yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Also browse other universities */}
      {hasUniversity && universities && universities.length > 1 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-4">
            Other Universities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universities
              .filter((uni) => uni.id !== universityId)
              .map((uni) => (
                <Link
                  key={uni.id}
                  href={`/${uni.id}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-5 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    {uni.logo_url ? (
                      <img src={uni.logo_url} alt={uni.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="text-gray-500 text-sm font-bold">
                        {uni.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#0F172A] dark:text-white text-sm truncate">
                      {uni.name}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">Browse subjects →</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Quick Access */}
      <section>
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🏫', label: 'My Subjects', href: hasUniversity ? `/${universityId}` : '/home' },
            { icon: '📖', label: 'Bookmarks', href: '/bookmarks' },
            { icon: '🔔', label: 'Notifications', href: '/notifications' },
            { icon: '👤', label: 'Profile', href: '/profile' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2E8F0] dark:border-gray-800 p-4 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all text-center group"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                {item.label}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}