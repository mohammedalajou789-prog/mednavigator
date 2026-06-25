'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { useUser } from '@/hooks/useUser'
import { useUIStore } from '@/stores/uiStore'
import { createClient } from '@/lib/supabase/client'

interface StudentLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', href: '/home', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> },
  { label: 'My Subjects', href: '/subjects', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'My Progress', href: '/progress', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label: 'Bookmarks', href: '/bookmarks', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
  { label: 'Notes', href: '/notes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg> },
  
]

const otherItems = [
  { label: 'Notifications', href: '/notifications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> },
  { label: 'Settings', href: '/settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { label: 'Help Center', href: '/help', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
]

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useUserStore()
  useUser()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true)
      else setSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
    window.location.href = '/'
  }

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home'
    return pathname.startsWith(href)
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MN'

  const sidebarVisible = sidebarOpen || mobileOpen

  return (
    <div className="flex h-screen" style={{ background: '#F5F6FA', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200 ${sidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${!sidebarOpen && 'lg:hidden'}`}
        style={{ width: '266px', flexShrink: 0, background: 'linear-gradient(185deg,#121E3E 0%,#0C152F 100%)', padding: '22px 16px 18px', color: '#9AA7C4' }}
      >
        {/* Logo */}
        <div style={{ padding: '0 6px 18px', display: 'flex', alignItems: 'center' }}>
          <Link href="/home">
            <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>
              Med<span style={{ color: '#9FB8F2' }}>Navigator</span>
            </span>
          </Link>
        </div>

        {/* User card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 10px', marginBottom: '18px', borderRadius: '14px', background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(140deg,#5B8CFF,#2F6BFF)', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#EAF0FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name ?? 'Student'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#7C89A8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email ?? ''}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.14em', color: '#56648A', padding: '8px 12px 6px' }}>LEARNING</div>
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} prefetch={false} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '11px', fontSize: '14px', fontWeight: active ? 600 : 500,
                color: active ? '#EAF0FF' : '#9AA7C4', cursor: 'pointer', textDecoration: 'none',
                background: active ? 'rgba(76,130,255,.16)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(120,160,255,.2)' : 'none',
                transition: 'background .15s, color .15s',
              }}>
                <span style={{ color: active ? '#6E9BFF' : '#7C89A8', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.14em', color: '#56648A', padding: '16px 12px 6px' }}>OTHER</div>
          {otherItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} prefetch={false} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '11px', fontSize: '14px', fontWeight: active ? 600 : 500,
                color: active ? '#EAF0FF' : '#9AA7C4', cursor: 'pointer', textDecoration: 'none',
                background: active ? 'rgba(76,130,255,.16)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(120,160,255,.2)' : 'none',
                transition: 'background .15s, color .15s',
              }}>
                <span style={{ color: active ? '#6E9BFF' : '#7C89A8', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', marginTop: '8px', borderRadius: '11px', fontSize: '14px', fontWeight: 600, color: '#FF8C8C', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,.06)', background: 'transparent', border: 'none', width: '100%', fontFamily: 'inherit' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </aside>

      {/* ─── MAIN AREA ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── TOP HEADER ── */}
        <header style={{ height: '72px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #EBEDF3', display: 'flex', alignItems: 'center', gap: '18px', padding: '0 26px' }}>

          {/* Sidebar toggle */}
          <button
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '11px', background: '#F4F5F8', border: '1px solid #EBEDF3', color: '#5B6678', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => { if (window.innerWidth >= 1024) setSidebarOpen(!sidebarOpen); else setMobileOpen(!mobileOpen) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '560px', display: 'flex', alignItems: 'center', gap: '11px', height: '42px', padding: '0 16px', borderRadius: '12px', background: '#F4F5F8', border: '1px solid #EBEDF3' }}>
            <svg style={{ flexShrink: 0, color: '#9AA3B2' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Search lectures, sheets, quizzes..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: '14px', color: '#1B2335' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val) router.push(`/search?q=${encodeURIComponent(val)}`)
                }
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Link href="/notifications" prefetch={false} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '11px', background: '#F4F5F8', border: '1px solid #EBEDF3', color: '#5B6678', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            
          </Link>

          {/* Avatar */}
          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 8px 0 6px', borderRadius: '24px', background: '#F4F5F8', border: '1px solid #EBEDF3', cursor: 'pointer', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(140deg,#5B8CFF,#2F6BFF)', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
              {initials}
            </div>
            <svg style={{ color: '#8A93A6' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </Link>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden flex-shrink-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1">
          {[
            { label: 'Home', href: '/home' },
            { label: 'Subjects', href: '/subjects' },
            { label: 'Bookmarks', href: '/bookmarks' },
            { label: 'Alerts', href: '/notifications' },
          ].map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-medium ${isActive(item.href) ? 'text-blue-600' : 'text-slate-400'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useUIStore()
  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }
  return (
    <button
      onClick={cycle}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '11px', background: '#F4F5F8', border: '1px solid #EBEDF3', color: '#5B6678', cursor: 'pointer', flexShrink: 0 }}
      aria-label={`Theme: ${theme}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {theme === 'dark' ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/> : <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>}
      </svg>
    </button>
  )
}