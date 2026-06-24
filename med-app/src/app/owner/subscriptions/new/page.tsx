'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  full_name: string
  email: string
}

interface Subject {
  id: string
  name: string
  university_id: string
  universities: { name: string } | null
}

export default function NewSubscriptionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [form, setForm] = useState({
    userId: '',
    subjectId: '',
    durationDays: '60',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'student')
        .eq('status', 'active')
        .order('full_name')
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, university_id, universities(name)')
        .eq('is_published', true)
        .order('name')
      setUsers((usersData ?? []).map(u => ({
        ...u,
        full_name: u.full_name ?? '',
        email: u.email ?? '',
      })))
      setSubjects(subjectsData as Subject[] ?? [])
    }
    load()
  }, [])

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.userId) { setError('Please select a student.'); return }
    if (!form.subjectId) { setError('Please select a subject.'); return }
    if (!form.durationDays || Number(form.durationDays) < 1) { setError('Duration must be at least 1 day.'); return }
    setError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + Number(form.durationDays))

      const { error: insertError } = await supabase
        .from('subject_subscriptions')
        .insert({
          user_id: form.userId,
          subject_id: form.subjectId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
        })

      if (insertError) { setError('Failed to grant access. ' + insertError.message); return }
      router.push('/owner/subscriptions')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedUser = users.find((u) => u.id === form.userId)
  const selectedSubject = subjects.find((s) => s.id === form.subjectId)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/owner/subscriptions" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1">
          ← Back to Subscriptions
        </Link>
        <h1 className="text-2xl font-semibold text-[#0F172A] mt-2">Grant Access</h1>
        <p className="text-[#64748B] mt-1">Manually grant a student access to a subject</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Student <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mb-2"
            />
            {userSearch && (
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#64748B]">No students found.</div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setForm((prev) => ({ ...prev, userId: u.id })); setUserSearch('') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-[10px] font-bold">{u.full_name?.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">{u.full_name}</p>
                        <p className="text-xs text-[#64748B]">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedUser && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-[10px] font-bold">{selectedUser.full_name?.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0F172A]">{selectedUser.full_name}</p>
                  <p className="text-xs text-[#64748B]">{selectedUser.email}</p>
                </div>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, userId: '' }))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.universities?.name} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Duration (days) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              {['30', '60', '90', '180'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, durationDays: d }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    form.durationDays === d
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <input
              type="number"
              value={form.durationDays}
              onChange={(e) => setForm((prev) => ({ ...prev, durationDays: e.target.value }))}
              min="1"
              placeholder="Custom duration"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {form.userId && form.subjectId && form.durationDays && (
            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">Summary</p>
              <p className="text-sm text-[#0F172A]">
                <span className="font-medium">{selectedUser?.full_name}</span> will get access to{' '}
                <span className="font-medium">{selectedSubject?.name}</span> for{' '}
                <span className="font-medium">{form.durationDays} days</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Granting...' : 'Grant Access'}
            </button>
            <Link href="/owner/subscriptions" className="px-5 py-2.5 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}