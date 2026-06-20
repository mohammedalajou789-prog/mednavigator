'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { generateDeviceFingerprint } from '@/lib/utils/device'
import { checkAndRegisterDevice } from '@/lib/services/devices'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deviceBlocked, setDeviceBlocked] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(formData: LoginFormData) {
    setServerError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (error) { setServerError('Invalid email or password.'); return }
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setServerError('Login failed.'); return }
      const { data: userProfile } = await supabase
        .from('users').select('role, status').eq('auth_user_id', authUser.id).single()
      if (userProfile?.status === 'disabled' || userProfile?.status === 'banned') {
        await supabase.auth.signOut()
        setServerError('Your account has been suspended.')
        return
      }
      const role = userProfile?.role ?? 'student'
      if (role === 'student') {
        const { data: userRecord } = await supabase
          .from('users').select('id').eq('auth_user_id', authUser.id).single()
        if (userRecord?.id) {
          const fingerprint = await generateDeviceFingerprint()
          const deviceResult = await checkAndRegisterDevice(userRecord.id, fingerprint)
          if (!deviceResult.allowed) {
            await supabase.auth.signOut()
            setDeviceBlocked(deviceResult.supportWhatsApp)
            return
          }
        }
      }
      if (role === 'owner') window.location.href = '/owner'
      else if (role === 'admin') window.location.href = '/admin'
      else window.location.href = '/home'
    } finally {
      setIsSubmitting(false)
    }
  }

  if (deviceBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Device Not Recognized</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This account is already linked to another device. For assistance, contact support.
            </p>
            <a href={`https://wa.me/${deviceBlocked.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
              Contact Support on WhatsApp
            </a>
            <div className="mt-4">
              <button onClick={() => setDeviceBlocked(null)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your MedNavigator account</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {serverError && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input id="email" type="email" autoComplete="email" {...register('email')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors', errors.email ? 'border-red-400' : 'border-gray-300')}
                placeholder="you@example.com" />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input id="password" type="password" autoComplete="current-password" {...register('password')}
                className={cn('w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors', errors.password ? 'border-red-400' : 'border-gray-300')}
                placeholder="••••••••" />
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Do not have an account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">Create account</Link>
          </p>
          <div className="mt-3 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Continue as guest</Link>
          </div>
        </div>
      </div>
    </div>
  )
}