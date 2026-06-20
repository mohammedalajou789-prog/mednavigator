'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserActionsProps {
  userId: string
  currentStatus: string
}

export default function UserActions({ userId, currentStatus }: UserActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function updateStatus(newStatus: string) {
    setIsLoading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)
      if (error) { setMessage('Failed to update status.'); return }
      setMessage(`User ${newStatus} successfully.`)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function resetDevice() {
    setIsLoading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('devices')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true)
      if (error) { setMessage('Failed to reset device.'); return }
      setMessage('Device reset successfully. User can now log in from a new device.')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
      <h2 className="font-semibold text-[#0F172A] mb-4">Actions</h2>
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      )}
      <div className="space-y-2">
        <button
          onClick={resetDevice}
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-60 text-left"
        >
          Reset Device
        </button>
        {currentStatus === 'active' && (
          <button
            onClick={() => updateStatus('disabled')}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-60 text-left"
          >
            Disable Account
          </button>
        )}
        {currentStatus === 'disabled' && (
          <button
            onClick={() => updateStatus('active')}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-60 text-left"
          >
            Enable Account
          </button>
        )}
        {currentStatus !== 'banned' && (
          <button
            onClick={() => updateStatus('banned')}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 text-left"
          >
            Ban Account
          </button>
        )}
        {currentStatus === 'banned' && (
          <button
            onClick={() => updateStatus('active')}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-60 text-left"
          >
            Unban Account
          </button>
        )}
      </div>
    </div>
  )
}