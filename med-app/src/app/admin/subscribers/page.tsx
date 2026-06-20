import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">MedNavigator</span>
          <span className="text-[#64748B] text-sm">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{profile?.full_name}</span>
          <Link href="/admin" className="text-sm text-blue-400 hover:text-blue-300">← Dashboard</Link>
        </div>
      </div>

      <div className="flex">
        <div className="w-64 min-h-screen bg-[#1E293B] text-white p-4 flex flex-col gap-1">
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'My Subjects', href: '/admin/subjects' },
            { label: 'Content Builder', href: '/admin/content' },
            { label: 'Subscribers', href: '/admin/subscribers', active: true },
            { label: 'Analytics', href: '/admin/analytics' },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active ? 'bg-[#2563EB] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0F172A]">Subscribers</h1>
            <p className="text-[#64748B] mt-1">Manage subscribers for your assigned subjects</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B]">Total</p>
              <p className="text-3xl font-semibold text-[#0F172A] mt-1">{subscriptions?.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B]">Active</p>
              <p className="text-3xl font-semibold text-green-600 mt-1">{activeCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
              <p className="text-sm text-[#64748B]">Expired</p>
              <p className="text-3xl font-semibold text-[#64748B] mt-1">{expiredCount}</p>
            </div>
          </div>

          {assignments && assignments.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 mb-6">
              <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-3">Your Assigned Subjects</p>
              <div className="flex flex-wrap gap-2">
                {assignments.map((a) => (
                  <span key={a.subject_id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {(a.subjects as { name: string } | null)?.name ?? '—'}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="font-semibold text-[#0F172A]">All Subscriptions</h2>
            </div>
            {!subscriptions || subscriptions.length === 0 ? (
              <div className="px-6 py-16 text-center text-[#64748B] text-sm">
                {assignedSubjectIds.length === 0 ? 'No subjects assigned to you yet.' : 'No subscriptions yet.'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Days Left</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {subscriptions.map((sub) => {
                    const daysLeft = getDaysRemaining(sub.end_date)
                    const subUser = sub.users as { id: string; full_name: string; email: string } | null
                    const subSubject = sub.subjects as { id: string; name: string } | null
                    return (
                      <tr key={sub.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#0F172A] text-sm">{subUser?.full_name ?? '—'}</p>
                          <p className="text-xs text-[#64748B]">{subUser?.email ?? '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#64748B]">{subSubject?.name ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200'
                            : sub.status === 'expired' ? 'bg-gray-100 text-gray-500 border border-gray-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>{sub.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#64748B]">{new Date(sub.end_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {sub.status === 'active' ? (
                            <span className={`text-sm font-medium ${
                              daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'
                            }`}>{daysLeft > 0 ? `${daysLeft} days` : 'Expired'}</span>
                          ) : <span className="text-sm text-[#64748B]">—</span>}
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
      </div>
    </div>
  )
}