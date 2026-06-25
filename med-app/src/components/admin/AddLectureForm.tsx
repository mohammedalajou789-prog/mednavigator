'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createLectureSchema, type CreateLectureFormValues } from '@/lib/validations/content'

interface ChapterOption {
  id: string
  title: string
}

interface Props {
  subjectId: string
  subjectType: 'standard' | 'system' | 'clinical'
  chapters: ChapterOption[]
  subSubjects: ChapterOption[]
  defaultChapterId?: string
  defaultSubSubjectId?: string
}

export default function AddLectureForm({
  subjectId,
  subjectType,
  chapters,
  subSubjects,
  defaultChapterId,
  defaultSubSubjectId,
}: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isSystemSubject = subjectType === 'system'
  const parentOptions = isSystemSubject ? subSubjects : chapters
  const parentLabel = isSystemSubject ? 'Sub-Subject' : 'Chapter'
  const defaultParent = isSystemSubject ? defaultSubSubjectId : defaultChapterId
  const [selectedParentId, setSelectedParentId] = useState(defaultParent ?? (parentOptions[0]?.id ?? ''))

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLectureFormValues>({
    resolver: zodResolver(createLectureSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      is_preview: false,
    },
  })

  const onSubmit = async (values: CreateLectureFormValues) => {
    if (!selectedParentId) {
      setServerError(`Please select a ${parentLabel} first.`)
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    try {
      const body = {
        subject_id: subjectId,
        title: values.title,
        description: values.description || null,
        is_preview: values.is_preview,
        ...(isSystemSubject
          ? { sub_subject_id: selectedParentId }
          : { chapter_id: selectedParentId }),
      }

      const res = await fetch('/api/admin/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1.5">
            {parentLabel} <span className="text-red-500">*</span>
          </label>
          <select
            id="parent"
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm
              text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors"
          >
            <option value="">Select a {parentLabel}...</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Lecture Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Heart Failure, Acute Inflammation, Nephrotic Syndrome"
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
            placeholder="Brief description of what this lecture covers..."
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none
              ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            id="is_preview"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            {...register('is_preview')}
          />
          <div>
            <label htmlFor="is_preview" className="text-sm font-medium text-gray-700 cursor-pointer">
              Preview lecture
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Preview lectures are visible to all users even without a subscription.
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            The lecture will be created as a <strong>Draft</strong>. After creation, open the Content Builder to add a Sheet, Summary, Flashcards, Quiz, or Previous Year Questions.
          </p>
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
          disabled={isSubmitting || !selectedParentId}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Lecture'}
        </button>
      </div>
    </form>
  )
}