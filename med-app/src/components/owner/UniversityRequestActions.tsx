'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  requestId: string
  universityName: string
}

export default function UniversityRequestActions({ requestId, universityName }: Props) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async () => {
    setIsApproving(true)
    setError(null)

    try {
      const res = await fetch(`/api/owner/university-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          university_name: universityName,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error ?? 'Failed to approve request.')
        return
      }

      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    setError(null)

    try {
      const res = await fetch(`/api/owner/university-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error ?? 'Failed to reject request.')
        return
      }

      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleReject}
          disabled={isRejecting || isApproving}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
            rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isRejecting ? 'Rejecting...' : 'Reject'}
        </button>
        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isApproving ? 'Approving...' : 'Approve & Create University'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}