import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SettingsPage() {
  const profile = await requireAuth()
  const supabase = await createServerClient()

  const { data: device } = await supabase
    .from('devices')
    .select('id, device_name, is_active, last_login_at')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences</p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Account Information</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          <div className="px-5 py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Full Name</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{profile.full_name ?? '—'}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Email</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{profile.email ?? '—'}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Account Status</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">Active</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appearance</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Theme</p>
          <div className="flex gap-3">
            {['Light', 'Dark', 'System'].map((t) => (
              <div key={t} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-3 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Use the sun icon in the top bar to switch themes.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Device</h2>
        </div>
        <div className="px-5 py-4">
          {device ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{device.device_name ?? 'Current Device'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last login: {device.last_login_at ? new Date(device.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">Active</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No active device registered.</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">To reset your device, contact support via WhatsApp.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Legal</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">Terms of Service</p>
            <span className="text-xs text-slate-400">View</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">Privacy Policy</p>
            <span className="text-xs text-slate-400">View</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">Intellectual Property Agreement</p>
            <span className="text-xs text-slate-400">View</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/30">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Sign out</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sign out from your account on this device</p>
          </div>
          <a href="/api/auth/logout" className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">Logout</a>
        </div>
      </div>
    </div>
  )
}