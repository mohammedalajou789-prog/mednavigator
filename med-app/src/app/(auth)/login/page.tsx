// @ts-nocheck
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
    width: 100%; max-width: 1000px;
    display: grid; grid-template-columns: 1.05fr 0.95fr;
    min-height: 600px; border-radius: 24px; overflow: hidden;
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
    padding: 48px 46px; animation: mn-fadeUp .5s cubic-bezier(.2,.7,.2,1) both;
  }
  .mn-input {
    width: 100%; padding: 14px 14px 14px 42px; border-radius: 13px;
    border: 1.5px solid #E8ECF2; background: #F8FAFD;
    font-family: inherit; font-size: 14.5px; color: #0F172A;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .mn-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
  .mn-input-pw { padding-right: 44px; }
  .mn-input-error { border-color: #EF4444 !important; }
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

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deviceBlocked, setDeviceBlocked] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)

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
        .from('users').select('role, status').eq('auth_user_id', authUser.id).single() as { data: { role: string; status: string } | null }
      if (userProfile?.status === 'disabled' || userProfile?.status === 'banned') {
        await supabase.auth.signOut()
        setServerError('Your account has been suspended.')
        return
      }
      const role = userProfile?.role ?? 'student'
      if (role === 'student') {
        const { data: userRecord } = await supabase
          .from('users').select('id').eq('auth_user_id', authUser.id).single() as { data: { id: string } | null }
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
    const waUrl = 'https://wa.me/' + deviceBlocked.replace(/[^0-9]/g, '')
    return (
      <>
        <style>{STYLES}</style>
        <div className="mn-wrap">
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div style={{
              background: '#fff', borderRadius: 24, border: '1px solid #FEE2E2',
              padding: '40px 36px', textAlign: 'center',
              boxShadow: '0 24px 60px -12px rgba(15,23,42,0.10)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-.02em' }}>
                Device Not Recognized
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 28px' }}>
                This account is already linked to another device. For assistance, contact support.
              </p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', background: '#16A34A', color: '#fff',
                borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                Contact Support on WhatsApp
              </a>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setDeviceBlocked(null)}
                  style={{ fontSize: 13, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Back to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="mn-wrap">
        <div className="mn-card">

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
                Pick up right<br />where you<br />left off.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#B6C2D6', margin: 0, maxWidth: 300 }}>
                Your sheets, flashcards, quizzes and reading progress — synced and ready the moment you sign in.
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

          <div className="mn-form-panel">
            <div style={{ width: '100%', maxWidth: 360 }}>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 8px' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 32px' }}>
                Sign in to your MedNavigator account
              </p>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Email address
                </label>
                <div style={{ position: 'relative', marginBottom: errors.email ? 6 : 20 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 6L2 7" />
                  </svg>
                  <input
                    id="email" type="email" autoComplete="email" placeholder="you@example.com"
                    {...register('email')}
                    className={cn('mn-input', errors.email && 'mn-input-error')}
                  />
                </div>
                {errors.email && (
                  <p style={{ marginBottom: 14, fontSize: 12, color: '#DC2626' }}>{errors.email.message}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700 }}>Password</label>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>Forgot?</span>
                </div>
                <div style={{ position: 'relative', marginBottom: errors.password ? 6 : 22 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={cn('mn-input mn-input-pw', errors.password && 'mn-input-error')}
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
                {errors.password && (
                  <p style={{ marginBottom: 14, fontSize: 12, color: '#DC2626' }}>{errors.password.message}</p>
                )}
                <label onClick={() => setRemember(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 9, marginBottom: 24,
                  cursor: 'pointer', userSelect: 'none',
                }}>
                  <span style={{
                    width: 19, height: 19, borderRadius: 6, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: remember ? 'linear-gradient(135deg,#2563EB,#4F46E5)' : '#fff',
                    border: remember ? 'none' : '1.5px solid #C7D2FE',
                    transition: 'background .18s, border-color .18s',
                  }}>
                    {remember && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>Remember me on this device</span>
                </label>
                {serverError && (
                  <div style={{
                    marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                    background: '#FEF2F2', border: '1px solid #FEE2E2',
                  }}>
                    <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{serverError}</p>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting} className="mn-btn">
                  {isSubmitting ? 'Signing in…' : (
                    <>
                      Sign in
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
              <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', margin: '26px 0 0' }}>
                Do not have an account?{' '}
                <Link href="/register" style={{ fontWeight: 700, color: '#2563EB' }}>Create account</Link>
              </p>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link href="/" style={{ fontSize: 13.5, color: '#94A3B8' }}>Continue as guest →</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}