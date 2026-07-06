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
import { notifyOwnerUniversityRequest } from '@/lib/services/notifications'

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

/* ─────────────────────────────────────────
   STYLES — defined outside component
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .mn-wrap {
    min-height: 100vh;
    background: radial-gradient(1200px 600px at 78% -6%, #EEF3FF 0%, rgba(238,243,255,0) 60%), #F6F8FC;
    display: flex; align-items: center; justify-content: center; padding: 40px 26px;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .mn-card {
    width: 100%; max-width: 1060px;
    display: grid; grid-template-columns: 1.05fr 0.95fr;
    min-height: 640px; border-radius: 24px; overflow: hidden;
    box-shadow: 0 24px 60px -12px rgba(15,23,42,0.14);
  }
  .mn-brand {
    position: relative; overflow: hidden;
    background: linear-gradient(150deg, #0D1B2A 0%, #15294A 55%, #3B2A6B 100%);
    padding: 48px 44px; display: flex; flex-direction: column; justify-content: space-between;
  }
  .mn-blob1 {
    position: absolute; width: 280px; height: 280px; top: -60px; right: -60px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,235,.4), transparent 68%);
    filter: blur(10px); animation: mn-drift 12s ease-in-out infinite;
  }
  .mn-blob2 {
    position: absolute; width: 240px; height: 240px; bottom: -50px; left: -40px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,.34), transparent 68%);
    filter: blur(10px); animation: mn-drift2 14s ease-in-out infinite;
  }
  .mn-dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px);
    background-size: 24px 24px; opacity: .5;
  }
  .mn-feat {
    display: flex; align-items: center; gap: 13px;
    padding: 15px 16px; border-radius: 15px;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(6px);
  }
  .mn-feat-1 { animation: mn-floatC 7s ease-in-out infinite; }
  .mn-feat-2 { animation: mn-floatC 7s ease-in-out infinite .5s; }
  .mn-feat-3 { animation: mn-floatC 7s ease-in-out infinite 1s; }
  .mn-feat-icon {
    width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .mn-form-panel {
    background: #fff; display: flex; align-items: center; justify-content: center;
    padding: 44px 46px; animation: mn-fadeUp .5s cubic-bezier(.2,.7,.2,1) both;
    overflow-y: auto;
  }
  .mn-input {
    width: 100%; padding: 13px 15px; border-radius: 12px;
    border: 1.5px solid #E8ECF2; background: #F8FAFD;
    font-family: inherit; font-size: 14px; color: #0F172A;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .mn-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
  .mn-input-error { border-color: #EF4444 !important; }
  .mn-label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 7px; }
  .mn-field { margin-bottom: 16px; }
  .mn-err { margin-top: 5px; font-size: 12px; color: #DC2626; }
  .mn-btn {
    width: 100%; padding: 15px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #2563EB, #4F46E5);
    color: #fff; font-family: inherit; font-size: 15px; font-weight: 700;
    cursor: pointer; box-shadow: 0 14px 30px -10px rgba(37,99,235,.6);
    transition: opacity .2s, transform .15s;
    display: flex; align-items: center; justify-content: center; gap: 9px;
  }
  .mn-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
  .mn-btn:disabled { opacity: .6; cursor: not-allowed; }
  @keyframes mn-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(24px,-18px) scale(1.08); }
  }
  @keyframes mn-drift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-22px,20px) scale(1.06); }
  }
  @keyframes mn-floatC {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-9px); }
  }
  @keyframes mn-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: none; }
  }
  @media (max-width: 700px) {
    .mn-card { grid-template-columns: 1fr; }
    .mn-brand { display: none; }
    .mn-form-panel { padding: 40px 28px; }
  }
`

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [showRequest, setShowRequest] = useState(false)
  const [agree, setAgree] = useState(false)
  const [pwStrength, setPwStrength] = useState(0)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterFormData>({
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

  function calcStrength(v: string) {
    let sc = 0
    if (v.length >= 8) sc++
    if (/[A-Z]/.test(v)) sc++
    if (/[0-9]/.test(v)) sc++
    if (/[^A-Za-z0-9]/.test(v)) sc++
    return sc
  }

  const strColors = ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E']
  const strLabels = ['Weak — add more characters', 'Fair — add a number', 'Good — add a symbol', 'Strong password']

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
          const { data: ownerRecord } = await supabase
            .from('users').select('id').eq('role', 'owner').maybeSingle()
          if (ownerRecord) {
            await notifyOwnerUniversityRequest({
              ownerUserId: ownerRecord.id,
              requestedName: formData.requested_university_name?.trim() ?? '',
              studentName: formData.full_name,
            })
          }
        }
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (signInError) { setServerError('Account created but login failed. Please sign in manually.'); return }
      window.location.href = '/home'
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="mn-wrap">
        <div className="mn-card">

          {/* ── LEFT: BRAND PANEL ── */}
          <div className="mn-brand">
            <div className="mn-blob1" />
            <div className="mn-blob2" />
            <div className="mn-dots" />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 38 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: 'linear-gradient(150deg,#16273F,#0D1B2A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px -5px rgba(13,27,42,.5)',
                }}>
                  <svg width="23" height="23" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="16" stroke="#D7E3F4" strokeWidth="2.6" />
                    <path d="M5 24 H16 l2 -5 l3 10 l2 -5 H43" stroke="#D7E3F4" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M24 6 V24" stroke="#D7E3F4" strokeWidth="2.6" strokeLinecap="round" />
                    <path d="M24 24 V42" stroke="#5AA0FF" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  Med<span style={{ color: '#60A5FA' }}>Navigator</span>
                </span>
              </div>
              <h2 style={{ fontSize: 33, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-.03em', color: '#fff', margin: '0 0 16px' }}>
                Your medical<br />journey starts<br />here.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#B6C2D6', margin: 0, maxWidth: 300 }}>
                Create an account to save progress, bookmark sheets, and track every lecture across your subjects.
              </p>
            </div>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="mn-feat mn-feat-1">
                <div className="mn-feat-icon" style={{ background: 'rgba(96,165,250,.2)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Structured sheets</div>
                  <div style={{ fontSize: 12, color: '#8FA0BC' }}>Organized by subject &amp; lecture</div>
                </div>
              </div>
              <div className="mn-feat mn-feat-2">
                <div className="mn-feat-icon" style={{ background: 'rgba(124,58,237,.24)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 14l4-4 3 3 5-6" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Progress tracking</div>
                  <div style={{ fontSize: 12, color: '#8FA0BC' }}>See how far you&apos;ve read</div>
                </div>
              </div>
              <div className="mn-feat mn-feat-3">
                <div className="mn-feat-icon" style={{ background: 'rgba(14,165,164,.24)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Flashcards &amp; quizzes</div>
                  <div style={{ fontSize: 12, color: '#8FA0BC' }}>Test yourself before exams</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: FORM PANEL ── */}
          <div className="mn-form-panel">
            <div style={{ width: '100%', maxWidth: 370 }}>
              <h1 style={{ fontSize: 29, fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 8px' }}>
                Create your account
              </h1>
              <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 28px' }}>
                Join MedNavigator and get organized
              </p>

              {serverError && (
                <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                  <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* Full name */}
                <div className="mn-field">
                  <label className="mn-label">Full name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    {...register('full_name')}
                    className={cn('mn-input', errors.full_name && 'mn-input-error')}
                  />
                  {errors.full_name && <p className="mn-err">{errors.full_name.message}</p>}
                </div>

                {/* Email + Phone row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="mn-label">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                      className={cn('mn-input', errors.email && 'mn-input-error')}
                    />
                    {errors.email && <p className="mn-err">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="mn-label">Phone</label>
                    <input
                      type="tel"
                      placeholder="+962 7X XXX XXXX"
                      {...register('phone')}
                      className={cn('mn-input', errors.phone && 'mn-input-error')}
                    />
                    {errors.phone && <p className="mn-err">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* University */}
                <div className="mn-field">
                  <label className="mn-label">University</label>
                  <select
                    {...register('university_id')}
                    onChange={(e) => {
                      register('university_id').onChange(e)
                      setShowRequest(e.target.value === 'request')
                    }}
                    className="mn-input"
                    style={{ cursor: 'pointer' }}>
                    <option value="">Select your university</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>{uni.name}</option>
                    ))}
                    <option value="request">My university is not listed</option>
                  </select>
                </div>

                {/* University request */}
                {showRequest && (
                  <div className="mn-field">
                    <label className="mn-label">University name</label>
                    <input
                      type="text"
                      placeholder="Enter your university name"
                      {...register('requested_university_name')}
                      className="mn-input"
                    />
                  </div>
                )}

                {/* Password */}
                <div className="mn-field">
                  <label className="mn-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      {...register('password')}
                      onChange={(e) => {
                        register('password').onChange(e)
                        setPwStrength(calcStrength(e.target.value))
                      }}
                      className={cn('mn-input', errors.password && 'mn-input-error')}
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4,
                    }}>
                      {showPw ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Strength bars */}
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, marginBottom: 5 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} style={{
                        height: 4, flex: 1, borderRadius: 3,
                        background: i <= pwStrength ? strColors[Math.min(pwStrength - 1, 3)] : '#E9EEF6',
                        transition: 'background .25s',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                    {pwStrength > 0 ? strLabels[Math.min(pwStrength - 1, 3)] : 'Use 8+ characters with a number & symbol'}
                  </div>
                  {errors.password && <p className="mn-err">{errors.password.message}</p>}
                </div>

                {/* Confirm password */}
                <div className="mn-field">
                  <label className="mn-label">Confirm password</label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    {...register('confirm_password')}
                    className={cn('mn-input', errors.confirm_password && 'mn-input-error')}
                  />
                  {errors.confirm_password && <p className="mn-err">{errors.confirm_password.message}</p>}
                </div>

                {/* IP Agreement */}
                <div
                  onClick={() => { setAgree(v => !v); setValue('ip_agreement', !agree) }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 11,
                    padding: 14, borderRadius: 13,
                    background: '#F5F8FF', border: '1px solid #DDE6FB',
                    cursor: 'pointer', marginBottom: 20,
                  }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: agree ? 'linear-gradient(135deg,#2563EB,#4F46E5)' : '#fff',
                    border: agree ? 'none' : '1.5px solid #C7D2FE',
                    transition: 'background .18s, border-color .18s',
                  }}>
                    {agree && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 12, lineHeight: 1.5, color: '#475569' }}>
                    I understand the educational content on MedNavigator is protected intellectual property. Redistribution or unauthorized sharing is prohibited.
                  </span>
                </div>
                {errors.ip_agreement && <p className="mn-err" style={{ marginTop: -14, marginBottom: 14 }}>{errors.ip_agreement.message}</p>}

                {/* Submit */}
                <button type="submit" disabled={isSubmitting} className="mn-btn">
                  {isSubmitting ? 'Creating account…' : (
                    <>
                      Create account
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>

              </form>

              <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', margin: '22px 0 0' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ fontWeight: 700, color: '#2563EB' }}>Sign in</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}