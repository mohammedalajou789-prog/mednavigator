import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminAnalyticsPage() {
  const profile = await requireAuth()

  if (profile.role !== 'admin' && profile.role !== 'owner') redirect('/')

  const supabase = await createServerClient()

  const { data: assignments } = await supabase
    .from('admin_assignments')
    .select('subject_id, subjects(id, name), universities(name)')
    .eq('user_id', profile.id)
    .eq('is_active', true)

  const assignedSubjectIds = assignments?.map(a => a.subject_id) ?? []

  if (assignedSubjectIds.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 mt-1">Performance data for your assigned subjects</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium text-gray-900 dark:text-white">No subjects assigned yet</p>
          <p className="text-sm text-gray-500 mt-1">Contact the owner to get subjects assigned.</p>
        </div>
      </div>
    )
  }

  const [
    { data: subscriptions },
    { data: lectures },
    { data: searchData },
  ] = await Promise.all([
    supabase
      .from('subject_subscriptions')
      .select('id, status, subject_id, subjects(name)')
      .in('subject_id', assignedSubjectIds),
    supabase
      .from('lectures')
      .select('id, status, subject_id')
      .in('subject_id', assignedSubjectIds),
    supabase
      .from('search_history')
      .select('search_query')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length ?? 0
  const expiredSubscriptions = subscriptions?.filter(s => s.status === 'expired').length ?? 0

  const subjectSubCounts: Record<string, { name: string; active: number; total: number }> = {}
  for (const s of subscriptions ?? []) {
    const id = s.subject_id
    const subj = s.subjects as { name: string } | null
    if (!subjectSubCounts[id]) {
      subjectSubCounts[id] = { name: subj?.name ?? 'Unknown', active: 0, total: 0 }
    }
    subjectSubCounts[id].total++
    if (s.status === 'active') subjectSubCounts[id].active++
  }

  const publishedLectures = lectures?.filter(l => l.status === 'published').length ?? 0
  const draftLectures = lectures?.filter(l => l.status === 'draft').length ?? 0
  const lectureIds = lectures?.map(l => l.id) ?? []

  const [
    { count: sheetsCount },
    { count: flashcardsCount },
    { count: quizCount },
    { count: pyqCount },
    { data: progressData },
  ] = await Promise.all([
    lectureIds.length > 0
      ? supabase.from('sheets').select('*', { count: 'exact', head: true }).in('lecture_id', lectureIds).eq('status', 'published')
      : Promise.resolve({ count: 0 }),
    lectureIds.length > 0
      ? supabase.from('flashcards').select('*', { count: 'exact', head: true }).in('lecture_id', lectureIds)
      : Promise.resolve({ count: 0 }),
    lectureIds.length > 0
      ? supabase.from('quiz_questions').select('*', { count: 'exact', head: true }).in('lecture_id', lectureIds)
      : Promise.resolve({ count: 0 }),
    lectureIds.length > 0
      ? supabase.from('previous_year_questions').select('*', { count: 'exact', head: true }).in('lecture_id', lectureIds)
      : Promise.resolve({ count: 0 }),
    lectureIds.length > 0
      ? supabase.from('user_progress').select('lecture_id, completed, content_type').in('lecture_id', lectureIds)
      : Promise.resolve({ data: [] }),
  ])

  const completedCount = progressData?.filter(p => p.completed).length ?? 0
  const inProgressCount = progressData?.filter(p => !p.completed).length ?? 0

  const searchCounts: Record<string, number> = {}
  for (const s of searchData ?? []) {
    const q = s.search_query.toLowerCase().trim()
    searchCounts[q] = (searchCounts[q] ?? 0) + 1
  }
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 mt-1">Performance data for your assigned subjects</p>
      </div>

      {/* Assigned Subjects Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {assignments?.map(a => (
          <span key={a.subject_id} className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 border border-blue-200 rounded-full">
            {(a.subjects as { name: string } | null)?.name ?? '—'}
          </span>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Subscribers', value: activeSubscriptions, color: 'text-green-600', icon: '✅' },
          { label: 'Expired Subscribers', value: expiredSubscriptions, color: 'text-red-500', icon: '⏰' },
          { label: 'Published Lectures', value: publishedLectures, color: 'text-blue-600', icon: '📖' },
          { label: 'Draft Lectures', value: draftLectures, color: 'text-amber-600', icon: '✏️' },
          { label: 'Published Sheets', value: sheetsCount ?? 0, color: 'text-blue-600', icon: '📄' },
          { label: 'Flashcards', value: flashcardsCount ?? 0, color: 'text-purple-600', icon: '🃏' },
          { label: 'Quiz Questions', value: quizCount ?? 0, color: 'text-green-600', icon: '❓' },
          { label: 'Previous Year Questions', value: pyqCount ?? 0, color: 'text-amber-600', icon: '📅' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Subscriptions per Subject */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Subscriptions per Subject</h2>
            <p className="text-xs text-gray-500 mt-0.5">Active vs total subscribers</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Object.values(subjectSubCounts).length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No subscription data yet.</div>
            ) : (
              Object.values(subjectSubCounts).map((s, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                    <span className="text-xs text-gray-500">{s.active} active / {s.total} total</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: s.total > 0 ? `${Math.round((s.active / s.total) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Progress */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Student Progress</h2>
            <p className="text-xs text-gray-500 mt-0.5">Completion activity across all lectures</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Completed Sessions', value: completedCount, color: 'bg-green-500' },
              { label: 'In Progress Sessions', value: inProgressCount, color: 'bg-blue-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{
                      width: (completedCount + inProgressCount) > 0
                        ? `${Math.round((item.value / (completedCount + inProgressCount)) * 100)}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            ))}
            {completedCount === 0 && inProgressCount === 0 && (
              <div className="text-center py-6 text-sm text-gray-400">No progress data yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* Most Searched Terms */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Most Searched Terms</h2>
          <p className="text-xs text-gray-500 mt-0.5">Platform-wide search activity</p>
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
  )
}