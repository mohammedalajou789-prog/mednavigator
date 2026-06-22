'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ProfileClientProps {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string
    role: string
    status: string
    created_at: string
  }
  universityName: string
  device: {
    id: string
    device_name: string | null
    is_active: boolean
    last_login_at: string | null
    created_at: string
  } | null
}

export default function ProfileClient({ profile, universityName, device }: ProfileClientProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MN'

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: err } = await supabase
      .from('users')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id)

    setSaving(false)
    if (err) {
      setError('Failed to save. Please try again.')
    } else {
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="p-6 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Avatar + status */}
        <div className="space-y-4">

          {/* Avatar card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold mb-4">
              {initials}
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-base">{fullName || '—'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{universityName}</p>
            <span className={`mt-3 text-xs font-medium px-3 py-1 rounded-full ${
              profile.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {profile.status}
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Device card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Device Status</h2>
            {device ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                  <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Registered</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {new Date(device.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Need to switch devices? Contact support on WhatsApp for a device reset.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">No device registered yet.</p>
            )}
          </div>

          {/* Legal */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Legal</h2>
            <div className="space-y-1.5">
              <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>
              <a href="#" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
            </div>
          </div>

        </div>

        {/* Right column — Personal info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Personal Information */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Personal Information</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditing(false); setFullName(profile.full_name); setPhone(profile.phone) }}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {success && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                Profile updated successfully.
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">

              {/* Full Name */}
              <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">Full Name</span>
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="col-span-2 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                ) : (
                  <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white">{fullName || '—'}</span>
                )}
              </div>

              {/* Email */}
              <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
                <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white">{profile.email || '—'}</span>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">Phone</span>
                {editing ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="col-span-2 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                ) : (
                  <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white">{phone || '—'}</span>
                )}
              </div>

              {/* University */}
              <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">University</span>
                <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white">{universityName}</span>
              </div>

              {/* Role */}
              <div className="grid grid-cols-3 gap-4 items-center py-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Role</span>
                <span className="col-span-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                    {profile.role}
                  </span>
                </span>
              </div>

            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-white dark:bg-slate-800 p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Danger Zone</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sign out from your account on this device.</p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
              >
                Sign Out
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}