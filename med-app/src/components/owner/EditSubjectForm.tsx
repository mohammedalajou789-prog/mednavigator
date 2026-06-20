'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Subject {
  id: string
  name: string
  description: string
  subject_type: string
  category: string
  access_mode: string
  price: number
  is_published: boolean
  is_active: boolean
  university_id: string
}

interface University {
  id: string
  name: string
}

interface Props {
  subject: Subject
  universities: University[]
}

export default function EditSubjectForm({ subject, universities }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: subject.name,
    description: subject.description,
    subject_type: subject.subject_type,
    category: subject.category,
    access_mode: subject.access_mode,
    price: subject.price,
    is_published: subject.is_published,
    is_active: subject.is_active,
    university_id: subject.university_id,
  })

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/owner/subjects/${subject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error ?? 'Failed to update subject.')
        return
      }

      setSuccessMessage('Subject updated successfully.')
      router.refresh()
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        {/* University */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
          <select
            value={form.university_id}
            onChange={e => handleChange('university_id', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {universities.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subject Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Subject Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Type</label>
          <select
            value={form.subject_type}
            onChange={e => handleChange('subject_type', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="standard">Standard</option>
            <option value="system">System</option>
            <option value="clinical">Clinical</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => handleChange('category', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">— Select Category —</option>
            <option value="preclinical">Pre-Clinical</option>
            <option value="clinical_major">Clinical Major</option>
            <option value="clinical_minor">Clinical Minor</option>
          </select>
        </div>

        {/* Access Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Access Mode</label>
          <select
            value={form.access_mode}
            onChange={e => handleChange('access_mode', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        {/* Price */}
        {form.access_mode !== 'free' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (JOD)</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={e => handleChange('price', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Published</p>
              <p className="text-xs text-gray-500">Visible to students when published</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_published', !form.is_published)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.is_published ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_published ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-500">Inactive subjects are hidden from all users</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_active', !form.is_active)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.is_active ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_active ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
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