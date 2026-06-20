'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EditUniversityPage() {
  const router = useRouter()
  const params = useParams()
  const universityId = params.universityId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    country: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    async function loadUniversity() {
      const supabase = createClient()
      const { data } = await supabase
        .from('universities')
        .select('name, country, description, is_active')
        .eq('id', universityId)
        .single()
      if (data) {
        setForm({
          name: data.name ?? '',
          country: data.country ?? '',
          description: data.description ?? '',
          is_active: data.is_active ?? true,
        })
      }
      setIsLoading(false)
    }
    loadUniversity()
  }, [universityId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('University name is required.'); return }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('universities')
        .update({
          name: form.name.trim(),
          country: form.country.trim() || null,
          description: form.description.trim() || null,
        })
        .eq('id', universityId)
      if (updateError) { setError('Failed to update university.'); return }
      setSuccess('University updated successfully.')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleArchive() {
    setIsArchiving(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('universities')
        .update({
          is_active: !form.is_active,
          archived_at: form.is_active ? new Date().toISOString() : null,
        })
        .eq('id', universityId)
      if (updateError) { setError('Failed to update status.'); return }
      setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
      setSuccess(form.is_active ? 'University archived.' : 'University restored.')
    } finally {
      setIsArchiving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/owner/universities"
          className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back to Universities
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F172A]">Edit University</h1>
            <p className="text-[#64748B] mt-1">{form.name}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            form.is_active
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
            {form.is_active ? 'Active' : 'Archived'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-4">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              University Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/owner/universities"
              className="px-5 py-2.5 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Archive / Restore */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h2 className="font-semibold text-[#0F172A] mb-1">
          {form.is_active ? 'Archive University' : 'Restore University'}
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          {form.is_active
            ? 'Archiving will hide this university from students. Content is preserved.'
            : 'Restoring will make this university visible to students again.'}
        </p>
        <button
          onClick={handleToggleArchive}
          disabled={isArchiving}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            form.is_active
              ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
          }`}
        >
          {isArchiving ? 'Processing...' : form.is_active ? 'Archive University' : 'Restore University'}
        </button>
      </div>
    </div>
  )
}