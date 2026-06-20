import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import UserActions from './UserActions'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, status, created_at, default_university_id, universities(name)')
    .eq('id', userId)
    .single()

  if (!user) redirect('/owner/users')

  const { data: subscriptions } = await supabase
    .from('subject_subscriptions')
    .select('id, status, start_date, end_date, subjects(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: devices } = await supabase
    .from('devices')
    .select('id, device_name, device_fingerprint, is_active, last_login_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: resetRequests } = await supabase
    .from('device_reset_requests')
    .select('id, reason, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/owner/users" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1">
          ← Back to Users
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg font-bold">
                {user.full_name?.slice(0, 2).toUpperCase() ?? 'MN'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#0F172A]">{user.full_name ?? '—'}</h1>
              <p className="text-[#64748B] text-sm mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'owner' ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>{user.role}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200'
              : user.status === 'disabled' ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>{user.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Info */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="font-semibold text-[#0F172A] mb-4">Profile</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#64748B]">Full Name</p>
                <p className="text-[#0F172A] font-medium mt-0.5">{user.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[#64748B]">Email</p>
                <p className="text-[#0F172A] font-medium mt-0.5">{user.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-[#64748B]">Phone</p>
                <p className="text-[#0F172A] font-medium mt-0.5">{user.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-[#64748B]">University</p>
                <p className="text-[#0F172A] font-medium mt-0.5">
                  {(user.universities as { name: string } | null)?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Joined</p>
                <p className="text-[#0F172A] font-medium mt-0.5">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <UserActions userId={userId} currentStatus={user.status ?? 'active'} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Devices */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="font-semibold text-[#0F172A] mb-4">Devices</h2>
            {!devices || devices.length === 0 ? (
              <p className="text-sm text-[#64748B]">No devices registered.</p>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{device.device_name ?? 'Unknown Device'}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Last login: {device.last_login_at ? new Date(device.last_login_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      device.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {resetRequests && resetRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Reset Requests</p>
                {resetRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-[#64748B]">{req.reason ?? 'No reason provided'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>{req.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="font-semibold text-[#0F172A] mb-4">Subscriptions</h2>
            {!subscriptions || subscriptions.length === 0 ? (
              <p className="text-sm text-[#64748B]">No subscriptions.</p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">
                        {(sub.subjects as { name: string } | null)?.name ?? '—'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {new Date(sub.start_date).toLocaleDateString()} → {new Date(sub.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      sub.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200'
                      : sub.status === 'expired' ? 'bg-gray-100 text-gray-500 border border-gray-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>{sub.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}