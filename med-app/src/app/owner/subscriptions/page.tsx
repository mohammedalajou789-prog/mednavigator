import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  const { data: subscriptions } = await supabase
    .from('subject_subscriptions')
    .select('id, status, start_date, end_date, created_at, user_id, subjects(id, name, universities(name))')
    .order('created_at', { ascending: false })

  const activeCount = subscriptions?.filter((s) => s.status === 'active').length ?? 0
  const expiredCount = subscriptions?.filter((s) => s.status === 'expired').length ?? 0
  const revokedCount = subscriptions?.filter((s) => s.status === 'revoked').length ?? 0

  function getDaysRemaining(endDate: string) {
    const diff = new Date(endDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Subscriptions</h1>
          <p className="text-[#64748B] mt-1">Manage user subject subscriptions</p>
        </div>
        <Link
          href="/owner/subscriptions/new"
          className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Grant Access
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Revoked</p>
          <p className="text-3xl font-semibold text-red-600 mt-1">{revokedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#0F172A]">All Subscriptions</h2>
        </div>
        {!subscriptions || subscriptions.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#64748B] text-sm">
            No subscriptions yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">User ID</th>
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
                const subject = sub.subjects as { id: string; name: string; universities: { name: string } | null } | null
                return (
                  <tr key={sub.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0F172A] text-sm">{sub.user_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#0F172A]">{subject?.name ?? '—'}</p>
                      <p className="text-xs text-[#64748B]">{subject?.universities?.name ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200'
                        : sub.status === 'expired' ? 'bg-gray-100 text-gray-500 border border-gray-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {new Date(sub.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {sub.status === 'active' ? (
                        <span className={`text-sm font-medium ${
                          daysLeft <= 3 ? 'text-red-600'
                          : daysLeft <= 7 ? 'text-amber-600'
                          : 'text-green-600'
                        }`}>
                          {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                        </span>
                      ) : (
                        <span className="text-sm text-[#64748B]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/owner/subscriptions/${sub.id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Manage
                      </Link>
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