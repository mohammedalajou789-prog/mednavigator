'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Admin {
  id: string
  full_name: string
  email: string
  phone: string
  status: string
}

interface Assignment {
  id: string
  subject_id: string
  university_id: string
  subject_name: string
  university_name: string
}

interface Subject {
  id: string
  name: string
  university_id: string
  university_name: string
}

interface Props {
  admin: Admin
  currentAssignments: Assignment[]
  allSubjects: Subject[]
}

export default function EditAdminForm({ admin, currentAssignments, allSubjects }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: admin.full_name,
    phone: admin.phone,
    status: admin.status,
  })

  // Track which subjects are assigned
  const [assignedIds, setAssignedIds] = useState<Set<string>>(
    new Set(currentAssignments.map(a => a.subject_id))
  )

  const toggleSubject = (subjectId: string) => {
    setAssignedIds(prev => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/owner/admins/${admin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          status: form.status,
          assigned_subject_ids: Array.from(assignedIds),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error ?? 'Failed to update admin.')
        return
      }

      setSuccessMessage('Admin updated successfully.')
      router.refresh()
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group subjects by university
  const subjectsByUniversity = allSubjects.reduce<Record<string, { name: string; subjects: Subject[] }>>((acc, s) => {
    if (!acc[s.university_id]) {
      acc[s.university_id] = { name: s.university_name, subjects: [] }
    }
    acc[s.university_id].subjects.push(s)
    return acc
  }, {})

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="text"
              value={admin.email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Subject Assignments */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Subject Assignments
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Select the subjects this admin can manage. Changes apply immediately after saving.
          </p>

          {Object.entries(subjectsByUniversity).map(([uniId, uni]) => (
            <div key={uniId} className="mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {uni.name}
              </p>
              <div className="space-y-2">
                {uni.subjects.map(subject => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={assignedIds.has(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {allSubjects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No subjects available.</p>
          )}
        </div>

        {/* Messages */}
        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}
        {successMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
            rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}