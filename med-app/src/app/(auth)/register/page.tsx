// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import type { University } from '@/types/database'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  university_id: z.string().optional(),
  requested_university_name: z.string().optional(),
  ip_agreement: z.boolean().refine((val) => val === true, 'You must accept the agreement'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [showRequest, setShowRequest] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { ip_agreement: false },
  })

  useEffect(() => {
    async function loadUniversities() {
      const supabase = createClient()
      const { data } = await supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      setUniversities((data as University[]) ?? [])
    }
    loadUniversities()
  }, [])

  async function onSubmit(formData: RegisterFormData) {
    setServerError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })
      if (authError) { setServerError(authError.message); return }
      if (!authData.user) { setServerError('Registration failed.'); return }
      const { error: profileError } = await supabase.from('users').insert({
        auth_user_id: authData.user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role: 'student',
        status: 'active',
        default_university_id: formData.university_id && formData.university_id !== 'request' ? formData.university_id : null,
      })
      if (profileError) { setServerError('Failed to create profile.'); return }
      const { data: userProfile } = await supabase
        .from('users').select('id').eq('auth_user_id', authData.user.id).single()
      if (userProfile) {
        await supabase.from('user_preferences').insert({
          user_id: userProfile.id,
          theme: 'system',
          notifications_enabled: true,
        })
        if (showRequest && formData.requested_university_name?.trim()) {
          await supabase.from('university_requests').insert({
            user_id: userProfile.id,
            requested_university_name: formData.requested_university_name.trim(),
            status: 'pending',
          })
        }
      }
      router.push('/')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-blue-600">Med</span>
            <span className="text-gray-900 dark:text-white">Navigator</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Create your account to get started</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {serverError && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
              <input type="text" {...register('full_name')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                  errors.full_name ? 'border-red-400' : 'border-gray-300 dark:border-gray-700')}
                placeholder="Your full name" />
              {errors.full_name && <p className="mt-1.5 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input type="email" {...register('email')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                  errors.email ? 'border-red-400' : 'border-gray-300 dark:border-gray-700')}
                placeholder="you@example.com" />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone number</label>
              <input type="tel" {...register('phone')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                  errors.phone ? 'border-red-400' : 'border-gray-300 dark:border-gray-700')}
                placeholder="+962 7X XXX XXXX" />
              {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">University</label>
              <select {...register('university_id')}
                onChange={(e) => { register('university_id').onChange(e); setShowRequest(e.target.value === 'request') }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select your university</option>
                {universities.map((uni) => <option key={uni.id} value={uni.id}>{uni.name}</option>)}
                <option value="request">My university is not listed</option>
              </select>
            </div>
            {showRequest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">University name</label>
                <input type="text" {...register('requested_university_name')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your university name" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input type="password" {...register('password')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                  errors.password ? 'border-red-400' : 'border-gray-300 dark:border-gray-700')}
                placeholder="Min. 8 characters" />
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
              <input type="password" {...register('confirm_password')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                  errors.confirm_password ? 'border-red-400' : 'border-gray-300 dark:border-gray-700')}
                placeholder="••••••••" />
              {errors.confirm_password && <p className="mt-1.5 text-xs text-red-600">{errors.confirm_password.message}</p>}
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" {...register('ip_agreement')}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  I understand that the educational content on MedNavigator is protected intellectual property. Redistribution, unauthorized sharing, or commercial use is prohibited.
                </span>
              </label>
              {errors.ip_agreement && <p className="mt-2 text-xs text-red-600">{errors.ip_agreement.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
          </p>
          <div className="mt-3 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Continue as guest →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}