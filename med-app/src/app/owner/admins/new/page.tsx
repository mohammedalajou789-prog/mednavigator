'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { notifyAdminAssigned } from '@/lib/services/notifications'

interface University {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  university_id: string
}

interface Assignment {
  universityId: string
  subjectId: string
}

export default function NewAdminPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: unis } = await supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      const { data: subs } = await supabase
        .from('subjects')
        .select('id, name, university_id')
        .eq('is_published', true)
        .order('name')
      setUniversities(unis ?? [])
      setSubjects(subs ?? [])
    }
    load()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const filteredSubjects = subjects.filter((s) => s.university_id === selectedUniversity)

  function handleAddAssignment() {
    if (!selectedUniversity || !selectedSubject) return
    const exists = assignments.some(
      (a) => a.universityId === selectedUniversity && a.subjectId === selectedSubject
    )
    if (exists) return
    setAssignments((prev) => [...prev, { universityId: selectedUniversity, subjectId: selectedSubject }])
    setSelectedSubject('')
  }

  function handleRemoveAssignment(index: number) {
    setAssignments((prev) => prev.filter((_, i) => i !== index))
  }

  function getUniversityName(id: string) {
    return universities.find((u) => u.id === id)?.name ?? '—'
  }

  function getSubjectName(id: string) {
    return subjects.find((s) => s.id === id)?.name ?? '—'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    if (!form.email.trim()) { setError('Email is required.'); return }
    if (!form.password.trim() || form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email.trim(),
        password: form.password,
        email_confirm: true,
      })

      // If admin API not available, use signUp instead
      if (authError) {
        setError('Failed to create admin account. ' + authError.message)
        return
      }

      const authUserId = authData.user?.id
      if (!authUserId) { setError('Failed to create auth user.'); return }

      // Create user profile
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: 'admin',
          status: 'active',
        })
        .select('id')
        .single()

      if (userError || !userRecord) { setError('Failed to create user profile.'); return }

      // Create assignments
      if (assignments.length > 0) {
        const assignmentRows = assignments.map((a) => ({
          user_id: userRecord.id,
          university_id: a.universityId,
          subject_id: a.subjectId,
          is_active: true,
        }))
        await supabase.from('admin_assignments').insert(assignmentRows)
      }


      // Notify admin of their new subject assignments
      for (const a of assignments) {
        const uni = universities.find(u => u.id === a.universityId)
        const sub = subjects.find(s => s.id === a.subjectId)
        if (uni && sub) {
          await notifyAdminAssigned({
            adminUserId: userRecord.id,
            subjectName: sub.name,
            universityName: uni.name,
          })
        }
      }
      router.push('/owner/admins')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/owner/admins" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1">
          ← Back to Admins
        </Link>
        <h1 className="text-2xl font-semibold text-[#0F172A] mt-2">Add Admin</h1>
        <p className="text-[#64748B] mt-1">Create a new admin account and assign subjects</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-4">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
              placeholder="e.g. Ahmed Al-Rashid"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email Address <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Phone Number</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange}
              placeholder="e.g. 0791234567"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Password <span className="text-red-500">*</span></label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>

          {/* Subject Assignments */}
          <div className="border-t border-[#E2E8F0] pt-5">
            <p className="text-sm font-medium text-[#0F172A] mb-3">Subject Assignments</p>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedUniversity}
                onChange={(e) => { setSelectedUniversity(e.target.value); setSelectedSubject('') }}
                className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select university</option>
                {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedUniversity}
                className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select subject</option>
                {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button
                type="button"
                onClick={handleAddAssignment}
                disabled={!selectedUniversity || !selectedSubject}
                className="px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {assignments.length > 0 && (
              <div className="space-y-2">
                {assignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-sm text-[#0F172A]">
                      {getUniversityName(a.universityId)} → {getSubjectName(a.subjectId)}
                    </span>
                    <button type="button" onClick={() => handleRemoveAssignment(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Creating...' : 'Create Admin'}
            </button>
            <Link href="/owner/admins" className="px-5 py-2.5 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}