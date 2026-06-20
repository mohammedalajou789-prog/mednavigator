'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SubscriberActionsProps {
  subscriptionId: string
  currentStatus: string
  endDate: string
}

export default function SubscriberActions({
  subscriptionId,
  currentStatus,
  endDate,
}: SubscriberActionsProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function extendDays(days: number) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const newEndDate = new Date(endDate)
      newEndDate.setDate(newEndDate.getDate() + days)
      await supabase
        .from('subject_subscriptions')
        .update({
          end_date: newEndDate.toISOString(),
          status: 'active',
        })
        .eq('id', subscriptionId)
      router.refresh()
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  async function revoke() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase
        .from('subject_subscriptions')
        .update({ status: 'revoked' })
        .eq('id', subscriptionId)
      router.refresh()
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Actions
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
            <div className="py-1">
              <p className="px-3 py-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Extend</p>
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => extendDays(days)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                >
                  + {days} days
                </button>
              ))}
              <div className="border-t border-[#E2E8F0] my-1" />
              {currentStatus !== 'revoked' && (
                <button
                  onClick={revoke}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Revoke Access
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}