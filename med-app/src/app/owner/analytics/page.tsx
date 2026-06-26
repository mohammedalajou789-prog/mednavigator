import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OwnerAnalyticsPage() {
  const supabase = await createServerClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: newUsers30d },
    { count: totalUniversities },
    { count: totalSubjects },
    { count: totalLectures },
    { count: totalSubscriptions },
    { count: activeSubscriptions },
    { data: popularSubjects },
    { data: searchData },
    { data: recentUsers },
    { count: pendingRequests },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('universities').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('lectures').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('subject_subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('subject_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subject_subscriptions').select('subject_id, subjects(name, universities(name))').eq('status', 'active').limit(100),
    supabase.from('search_history').select('search_query').order('created_at', { ascending: false }).limit(200),
    supabase.from('users').select('id, full_name, email, role, created_at, default_university_id').order('created_at', { ascending: false }).limit(5),
    supabase.from('university_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const subjectCounts: Record<string, { name: string; university: string; count: number }> = {}
  for (const s of popularSubjects ?? []) {
    const id = s.subject_id
    const subj = s.subjects as { name: string; universities: { name: string } | null } | null
    if (!subjectCounts[id]) {
      subjectCounts[id] = {
        name: subj?.name ?? 'Unknown',
        university: subj?.universities?.name ?? '',
        count: 0,
      }
    }
    subjectCounts[id].count++
  }
  const topSubjects = Object.values(subjectCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const searchCounts: Record<string, number> = {}
  for (const s of searchData ?? []) {
    const q = s.search_query.toLowerCase().trim()
    searchCounts[q] = (searchCounts[q] ?? 0) + 1
  }
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const expiredSubscriptions = (totalSubscriptions ?? 0) - (activeSubscriptions ?? 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Platform Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of platform activity and engagement.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers ?? 0, color: 'blue', icon: '👥' },
          { label: 'Students', value: totalStudents ?? 0, color: 'purple', icon: '🎓' },
          { label: 'New (30 days)', value: newUsers30d ?? 0, color: 'green', icon: '📈' },
          { label: 'Universities', value: totalUniversities ?? 0, color: 'amber', icon: '🏫' },
          { label: 'Published Subjects', value: totalSubjects ?? 0, color: 'blue', icon: '📚' },
          { label: 'Published Lectures', value: totalLectures ?? 0, color: 'purple', icon: '📖' },
          { label: 'Active Subscriptions', value: activeSubscriptions ?? 0, color: 'green', icon: '✅' },
          { label: 'Expired Subscriptions', value: expiredSubscriptions, color: 'red', icon: '⏰' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Top Subjects */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Most Subscribed Subjects</h2>
            <p className="text-xs text-gray-500 mt-0.5">Based on active subscriptions</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topSubjects.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No subscription data yet.</div>
            ) : (
              topSubjects.map((s, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.university}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    {s.count} subscribers
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Searches */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Most Searched Terms</h2>
            <p className="text-xs text-gray-500 mt-0.5">From student search history</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topSearches.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No search data yet.</div>
            ) : (
              topSearches.map(([query, count]) => (
                <div key={query} className="px-6 py-3 flex items-center justify-between">
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{query}</p>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
                    {count}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Registrations</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 5 users to join</p>
            </div>
            <Link href="/owner/users" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(recentUsers ?? []).map((u) => (
              <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">
                    {u.full_name?.slice(0, 2).toUpperCase() ?? '??'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  u.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                  u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Platform Alerts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Items that need your attention</p>
          </div>
          <div className="p-6 space-y-3">
            {(pendingRequests ?? 0) > 0 && (
              <Link href="/owner/university-requests" className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:border-amber-400 transition-colors">
                <div className="flex items-center gap-2">
                  <span>🏫</span>
                  <span className="text-sm text-amber-800 dark:text-amber-300">
                    {pendingRequests} pending university request{(pendingRequests ?? 0) > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-amber-600">Review →</span>
              </Link>
            )}
            {expiredSubscriptions > 0 && (
              <Link href="/owner/subscriptions" className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:border-red-400 transition-colors">
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <span className="text-sm text-red-800 dark:text-red-300">
                    {expiredSubscriptions} expired subscription{expiredSubscriptions > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-red-600">View →</span>
              </Link>
            )}
            {(pendingRequests ?? 0) === 0 && expiredSubscriptions === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                ✅ No alerts at this time.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}