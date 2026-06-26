import { requireAuth } from '@/lib/services/user'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────

interface University {
  id: string
  name: string
  logo_url: string | null
}

interface Subject {
  id: string
  name: string
  subject_type: string
  access_mode: string
  university_id: string
}

interface Subscription {
  id: string
  subject_id: string
  status: string
  end_date: string
  subject: Subject
}

interface Progress {
  lecture_id: string
  content_type: string
  progress_percentage: number
  completed: boolean
  last_accessed_at: string
  lecture: {
    id: string
    title: string
    subject_id: string | null
    chapter_id: string | null
  } | null
}

interface PinnedSubject {
  subject_id: string
  subject: Subject & {
    university: { id: string; name: string }
  }
}

interface Notification {
  id: string
  title: string
  message: string
  priority: string
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHrs < 1) return 'Just now'
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getTypeLabel(type: string) {
  if (type === 'standard') return 'Standard'
  if (type === 'system') return 'System'
  if (type === 'clinical') return 'Clinical'
  return type
}

function getAccessLabel(mode: string) {
  if (mode === 'free') return 'Free'
  if (mode === 'premium') return 'Premium'
  if (mode === 'mixed') return 'Mixed'
  return mode
}

// ── UI Components (Server) ─────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: string
  label: string
  value: string | number
  sub?: string
  color: 'blue' | 'purple' | 'green' | 'amber'
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-950/40',   icon: 'text-blue-600 dark:text-blue-400',   value: 'text-blue-700 dark:text-blue-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', icon: 'text-purple-600 dark:text-purple-400', value: 'text-purple-700 dark:text-purple-300' },
    green:  { bg: 'bg-green-50 dark:bg-green-950/40',  icon: 'text-green-600 dark:text-green-400',  value: 'text-green-700 dark:text-green-300' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-950/40',  icon: 'text-amber-600 dark:text-amber-400',  value: 'text-amber-700 dark:text-amber-300' },
  }
  const c = colorMap[color]
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex items-start gap-4 shadow-sm">
      <div className={`rounded-xl p-3 ${c.bg}`}>
        <span className={`text-xl ${c.icon}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-2xl font-semibold ${c.value}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    system: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    clinical: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {getTypeLabel(type)}
    </span>
  )
}

function AccessBadge({ mode }: { mode: string }) {
  const map: Record<string, string> = {
    free: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    mixed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${map[mode] ?? 'bg-slate-100 text-slate-600'}`}>
      {getAccessLabel(mode)}
    </span>
  )
}

// ── Page (Server Component) ────────────────────────────────────────────────

export default async function StudentDashboard() {
  const profile = await requireAuth()

  const supabase = await createClient()

  // All dashboard data in parallel
  const [
    uniResult,
    pinnedResult,
    subsResult,
    progressResult,
    bookmarkResult,
    notifResult,
    activeSubsResult,
  ] = await Promise.all([
    profile.default_university_id
      ? supabase.from('universities').select('id, name, logo_url').eq('id', profile.default_university_id).single()
      : Promise.resolve({ data: null }),

    supabase.from('pinned_subjects').select(`
      subject_id,
      subject:subjects ( id, name, subject_type, access_mode, university_id,
        university:universities ( id, name )
      )
    `).eq('user_id', profile.id).limit(6),

    supabase.from('subject_subscriptions').select(`
      id, subject_id, status, end_date,
      subject:subjects ( id, name, subject_type, access_mode, university_id )
    `).eq('user_id', profile.id).eq('status', 'active').order('end_date', { ascending: true }).limit(5),

    supabase.from('user_progress').select(`
      lecture_id, content_type, progress_percentage, completed, last_accessed_at,
      lecture:lectures ( id, title, subject_id, chapter_id )
    `).eq('user_id', profile.id).order('last_accessed_at', { ascending: false }).limit(5),

    supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),

    supabase.from('notifications').select('id, title, message, priority, created_at')
      .or(`target_type.eq.all,and(target_type.eq.user,user_id.eq.${profile.id})`)
      .order('created_at', { ascending: false }).limit(5),

    supabase.from('subject_subscriptions').select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id).eq('status', 'active'),
  ])

  // Unread notifications count
  const { data: readIds } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', profile.id)

  const readSet = new Set((readIds ?? []).map((r: { notification_id: string }) => r.notification_id))
  const notifications = (notifResult.data ?? []) as Notification[]
  const unreadCount = notifications.filter(n => !readSet.has(n.id)).length

  const university = uniResult.data as University | null
  const pinnedSubjects = (pinnedResult.data ?? []) as unknown as PinnedSubject[]
  const subscriptions = (subsResult.data ?? []) as unknown as Subscription[]
  const recentProgress = (progressResult.data ?? []) as unknown as Progress[]
  const bookmarkCount = bookmarkResult.count ?? 0
  const activeSubjectCount = activeSubsResult.count ?? 0

  const lastProgress = recentProgress.find(p => !p.completed && p.progress_percentage > 0)
    ?? recentProgress[0] ?? null

  const overallProgress = recentProgress.length > 0
    ? Math.round(recentProgress.reduce((acc, p) => acc + p.progress_percentage, 0) / recentProgress.length)
    : 0

  const firstName = profile.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div className="p-6 space-y-8 max-w-7xl">

      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(profile.full_name ?? null)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {university?.name ?? 'No university selected'} &middot;{' '}
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        {university && (
          <Link href={`/${university.id}`} className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Browse subjects →
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="📚" label="Active Subjects" value={activeSubjectCount} sub="subscribed" color="blue" />
        <KpiCard icon="📈" label="Overall Progress" value={`${overallProgress}%`} sub={`${recentProgress.filter(p => p.completed).length} lectures done`} color="green" />
        <KpiCard icon="🔖" label="Bookmarks" value={bookmarkCount} sub="saved items" color="purple" />
        <KpiCard icon="🔔" label="Notifications" value={unreadCount} sub={unreadCount === 0 ? 'all read' : 'unread'} color="amber" />
      </div>

      {/* Continue Learning */}
      {lastProgress && lastProgress.lecture && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Continue learning</h2>
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-lg">▶</div>
                <div>
                  <p className="text-xs font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-1">
                    {lastProgress.content_type.replace('_', ' ')}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">{lastProgress.lecture.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Last accessed {formatTimeAgo(lastProgress.last_accessed_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{lastProgress.progress_percentage}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">completed</p>
                </div>
                <Link
                  href={lastProgress.lecture.subject_id
                    ? `/${university?.id ?? ''}/${lastProgress.lecture.subject_id}/${lastProgress.lecture.id}`
                    : '#'}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors"
                >
                  Resume →
                </Link>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${lastProgress.progress_percentage}%` }} />
            </div>
          </div>
        </section>
      )}

      {/* Pinned Subjects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Pinned subjects</h2>
          {university && (
            <Link href={`/${university.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
          )}
        </div>
        {pinnedSubjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <p className="text-2xl mb-2">📌</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No pinned subjects yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pin a subject from the subject page to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedSubjects.map(({ subject_id, subject }) => (
              <Link
                key={subject_id}
                href={`/${subject.university_id}/${subject_id}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">📖</div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <TypeBadge type={subject.subject_type} />
                    <AccessBadge mode={subject.access_mode} />
                  </div>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">{subject.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subject.university?.name ?? ''}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Active Subscriptions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Active subscriptions</h2>
          <Link href="/subscriptions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
        </div>
        {subscriptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <p className="text-2xl mb-2">🔔</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No active subscriptions.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Contact support to activate access to premium subjects.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subscriptions.map(sub => {
              const days = getDaysRemaining(sub.end_date)
              const isExpiringSoon = days <= 7
              return (
                <div key={sub.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-base flex-shrink-0">✓</div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{sub.subject?.name ?? 'Unknown subject'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Expires {new Date(sub.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-sm font-semibold ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                      {days}d left
                    </span>
                    {isExpiringSoon && <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">Expiring soon</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Bottom Grid: Recent Activity + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Recent activity</h2>
          {recentProgress.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {recentProgress.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${p.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {p.content_type === 'sheet' ? '📄' : p.content_type === 'flashcards' ? '🃏' : p.content_type === 'quiz' ? '❓' : p.content_type === 'previous_years' ? '📅' : '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.lecture?.title ?? 'Lecture'}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{p.content_type.replace('_', ' ')} · {p.progress_percentage}%</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {p.completed && <p className="text-xs font-medium text-green-600 dark:text-green-400">Done</p>}
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatTimeAgo(p.last_accessed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notifications */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            <Link href="/notifications" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
          </div>
          {notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
              <p className="text-2xl mb-2">🔔</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">No notifications.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                    n.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                    n.priority === 'important' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-slate-100 dark:bg-slate-700'
                  }`}>🔔</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatTimeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}