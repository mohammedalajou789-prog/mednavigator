'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createChapterSchema, type CreateChapterFormValues } from '@/lib/validations/content'

interface Props {
  subjectId: string
}

export default function AddChapterForm({ subjectId }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateChapterFormValues>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const onSubmit = async (values: CreateChapterFormValues) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          title: values.title,
          description: values.description || null,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push(`/admin/subjects/${subjectId}`)
      router.refresh()
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Chapter Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Cardiology, Respiratory, Neurology"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
              ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            {...register('title')}
          />
          {errors.title && (
            <p className="mt-1.5 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Brief description of this chapter's scope..."
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none
              ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}
      </div>

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
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Chapter'}
        </button>
      </div>
    </form>
  )
}