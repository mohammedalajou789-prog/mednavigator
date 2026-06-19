import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, universities(id, name)')
    .eq('auth_user_id', user.id)
    .single()

  const { data: device } = await supabase
    .from('devices')
    .select('id, device_name, is_active, last_login_at, created_at')
    .eq('user_id', profile?.id)
    .eq('is_active', true)
    .maybeSingle()

  const university = profile?.universities as Record<string, unknown> | null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Profile</h1>
        <p className="text-[#64748B] mt-1">Manage your account information</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <h2 className="font-semibold text-[#0F172A] mb-4">Personal Information</h2>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: profile?.full_name },
              { label: 'Email', value: profile?.email },
              { label: 'Phone', value: profile?.phone },
              { label: 'University', value: university?.name as string ?? '—' },
              { label: 'Role', value: profile?.role },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2 border-b border-[#F8FAFC] last:border-0">
                <span className="text-sm text-[#64748B] w-32 flex-shrink-0">{item.label}</span>
                <span className="text-sm font-medium text-[#0F172A]">{item.value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <h2 className="font-semibold text-[#0F172A] mb-4">Device Status</h2>
          {device ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2 border-b border-[#F8FAFC]">
                <span className="text-sm text-[#64748B] w-32 flex-shrink-0">Device</span>
                <span className="text-sm font-medium text-[#0F172A]">{device.device_name ?? 'Registered Device'}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <span className="text-sm text-[#64748B] w-32 flex-shrink-0">Registered</span>
                <span className="text-sm text-[#0F172A]">{new Date(device.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                Need to switch devices? Contact support on WhatsApp for a device reset.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#64748B]">No device registered yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <h2 className="font-semibold text-[#0F172A] mb-3">Account Status</h2>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              profile?.status === 'active' ? 'bg-green-100 text-green-700' :
              profile?.status === 'disabled' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {profile?.status ?? 'unknown'}
            </span>
            <span className="text-sm text-[#64748B]">
              Member since {new Date(profile?.created_at ?? '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <h2 className="font-semibold text-[#0F172A] mb-3">Legal</h2>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-[#2563EB] hover:underline">Terms of Service</a>
            <a href="#" className="text-sm text-[#2563EB] hover:underline">Privacy Policy</a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <h2 className="font-semibold text-[#0F172A] mb-3">Danger Zone</h2>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
