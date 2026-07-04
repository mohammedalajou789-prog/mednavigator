'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { notifyNewSubject } from '@/lib/services/notifications'

interface University {
  id: string
  name: string
}

export default function NewSubjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [form, setForm] = useState({
    university_id: '',
    name: '',
    description: '',
    subject_type: 'standard',
    category: 'clinical_major',
    access_mode: 'free',
    is_published: false,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      setUniversities(data ?? [])
    }
    load()
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.university_id) { setError('Please select a university.'); return }
    if (!form.name.trim()) { setError('Subject name is required.'); return }
    setError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('subjects')
        .insert({
          university_id: form.university_id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          subject_type: form.subject_type,
          category: form.category,
          access_mode: form.access_mode,
          is_published: form.is_published,
          is_active: true,
        })
      if (insertError) { setError('Failed to create subject. ' + insertError.message); return }

      // Notify university students of new subject
      if (form.is_published) {
        const uni = universities.find(u => u.id === form.university_id)
        if (uni) {
          await notifyNewSubject({
            universityId: form.university_id,
            universityName: uni.name,
            subjectName: form.name.trim(),
          })
        }
      }
      router.push('/owner/subjects')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/owner/subjects" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1">
          ← Back to Subjects
        </Link>
        <h1 className="text-2xl font-semibold text-[#0F172A] mt-2">Add Subject</h1>
        <p className="text-[#64748B] mt-1">Create a new subject under a university</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* University */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              University <span className="text-red-500">*</span>
            </label>
            <select
              name="university_id"
              value={form.university_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Select a university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Internal Medicine"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional description..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Subject Type */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Subject Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'standard', label: 'Standard', desc: 'Chapters → Lectures' },
                { value: 'system', label: 'System', desc: 'Sub-Subjects → Lectures' },
                { value: 'clinical', label: 'Clinical', desc: 'Chapters + OSCE' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, subject_type: type.value }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    form.subject_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-[#E2E8F0] hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-medium ${form.subject_type === type.value ? 'text-blue-700' : 'text-[#0F172A]'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="preclinical">Pre-Clinical</option>
              <option value="clinical_major">Clinical Major</option>
              <option value="clinical_minor">Clinical Minor</option>
            </select>
          </div>

          {/* Access Mode */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Access Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'free', label: 'Free', desc: 'All content free' },
                { value: 'premium', label: 'Premium', desc: 'Requires subscription' },
                { value: 'mixed', label: 'Mixed', desc: 'Some free, some premium' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, access_mode: mode.value }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    form.access_mode === mode.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-[#E2E8F0] hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-medium ${form.access_mode === mode.value ? 'text-blue-700' : 'text-[#0F172A]'}`}>
                    {mode.label}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Publish */}
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="is_published" className="text-sm font-medium text-[#0F172A] cursor-pointer">
                Publish immediately
              </label>
              <p className="text-xs text-[#64748B]">If unchecked, subject will be saved as draft</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Subject'}
            </button>
            <Link href="/owner/subjects" className="px-5 py-2.5 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}