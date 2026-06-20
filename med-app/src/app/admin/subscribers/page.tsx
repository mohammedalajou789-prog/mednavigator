import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriberActions from './SubscriberActions'

export default async function AdminSubscribersPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/')

  const { data: assignments } = await supabase
    .from('admin_assignments')
    .select('subject_id, subjects(id, name), universities(name)')
    .eq('user_id', profile.id)
    .eq('is_active', true)

  const assignedSubjectIds = assignments?.map((a) => a.subject_id) ?? []

  const { data: subscriptions } = assignedSubjectIds.length > 0
    ? await supabase
        .from('subject_subscriptions')
        .select('id, status, start_date, end_date, user_id, subject_id, users(id, full_name, email), subjects(id, name)')
        .in('subject_id', assignedSubjectIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const activeCount = subscriptions?.filter((s) => s.status === 'active').length ?? 0
  const expiredCount = subscriptions?.filter((s) => s.status === 'expired').length ?? 0

  function getDaysRemaining(endDate: string) {
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Subscribers</h1>
        <p className="text-gray-500 mt-1">Manage subscribers for your assigned subjects</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: subscriptions?.length ?? 0, color: 'text-gray-900 dark:text-white' },
          { label: 'Active', value: activeCount, color: 'text-green-600' },
          { label: 'Expired', value: expiredCount, color: 'text-gray-500' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {assignments && assignments.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Assigned Subjects</p>
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => (
              <span key={a.subject_id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 border border-blue-200">
                {(a.subjects as { name: string } | null)?.name ?? '—'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">All Subscriptions</h2>
        </div>
        {!subscriptions || subscriptions.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500 text-sm">
            {assignedSubjectIds.length === 0 ? 'No subjects assigned to you yet.' : 'No subscriptions yet.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {subscriptions.map((sub) => {
                const daysLeft = getDaysRemaining(sub.end_date)
                const subUser = sub.users as { id: string; full_name: string; email: string } | null
                const subSubject = sub.subjects as { id: string; name: string } | null
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{subUser?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{subUser?.email ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{subSubject?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200'
                        : sub.status === 'expired' ? 'bg-gray-100 text-gray-500 border border-gray-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>{sub.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(sub.end_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {sub.status === 'active' ? (
                        <span className={`text-sm font-medium ${
                          daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'
                        }`}>{daysLeft > 0 ? `${daysLeft} days` : 'Expired'}</span>
                      ) : <span className="text-sm text-gray-500">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <SubscriberActions subscriptionId={sub.id} currentStatus={sub.status} endDate={sub.end_date} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}