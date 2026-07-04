'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { useUser } from '@/hooks/useUser'
import { useUIStore } from '@/stores/uiStore'
import { createClient } from '@/lib/supabase/client'

interface University {
  id: string
  name: string
  slug?: string | null
}

interface StudentLayoutProps {
  children: React.ReactNode
  universities?: University[]
  myUniSlug?: string | null
}

const GUEST_LOCKED_ROUTES = [
  '/home', '/bookmarks', '/notifications', '/profile',
  '/search', '/subscriptions', '/settings', '/notes',
  '/progress', '/help',
]

const studentNavItems = [
  { label: 'Dashboard',     href: '/home',      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
  { label: 'My University', href: '__my_uni__', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'My Progress',   href: '/progress',  icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label: 'Bookmarks',     href: '/bookmarks', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
  { label: 'Notes',         href: '/notes',     icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
]

const studentOtherItems = [
  { label: 'Notifications', href: '/notifications', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> },


]

const ExploreIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
)

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const LogoIcon = () => (
  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="5"/>
      <path d="M 50 50 L 50 22" fill="none" stroke="#93C5FD" strokeWidth="7" strokeLinecap="round"/>
      <path d="M 50 50 L 50 78" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"/>
      <path d="M 22 50 L 78 50" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="50" cy="50" r="5" fill="white"/>
    </svg>
  </div>
)

// ── Design tokens ──────────────────────────────────────────────────────────
const SIDEBAR_BG       = '#0D1B2A'
const SIDEBAR_BORDER   = 'rgba(255,255,255,0.07)'
const ACTIVE_BG        = 'rgba(37,99,235,0.18)'
const ACTIVE_COLOR     = '#F1F5F9'
const ACTIVE_BAR       = '#60A5FA'
const MUTED_COLOR      = '#94A3B8'
const ICON_ACTIVE      = '#60A5FA'
const ICON_MUTED       = '#64748B'

function navItemStyle(active: boolean, locked = false): React.CSSProperties {
  return {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px', borderRadius: '11px',
    fontSize: '14px', fontWeight: active ? 600 : 500,
    color: locked ? '#334155' : active ? ACTIVE_COLOR : MUTED_COLOR,
    cursor: 'pointer', textDecoration: 'none',
    background: active ? ACTIVE_BG : 'transparent',
    transition: 'background .15s, color .15s',
    opacity: locked ? 0.5 : 1,
  }
}

function iconColor(active: boolean, locked = false): string {
  if (locked) return '#334155'
  return active ? ICON_ACTIVE : ICON_MUTED
}

const sectionLabel: React.CSSProperties = {
  fontSize: '10.5px', fontWeight: 700, letterSpacing: '.12em',
  color: MUTED_COLOR, padding: '16px 12px 6px', textTransform: 'uppercase',
}

const firstSectionLabel: React.CSSProperties = {
  ...sectionLabel, padding: '6px 12px 6px',
}

// ── Active bar indicator ───────────────────────────────────────────────────
const ActiveBar = () => (
  <span style={{
    position: 'absolute', left: 0, top: '6px', bottom: '6px',
    width: '3px', borderRadius: '0 3px 3px 0', background: ACTIVE_BAR,
  }} />
)

export default function StudentLayout({ children, universities = [], myUniSlug }: StudentLayoutProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { user, isLoading, clearUser } = useUserStore()
  useUser()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [exploreOpen,  setExploreOpen]  = useState(false)
  const [guestToast,   setGuestToast]   = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)

  const isGuest = !isLoading && !user

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true)
      else setSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const onUniPage = universities.some(u => pathname.startsWith(`/${u.slug ?? u.id}`))
    if (onUniPage) setExploreOpen(true)
  }, [pathname, universities])

  useEffect(() => {
    if (guestToast) {
      const t = setTimeout(() => setGuestToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [guestToast])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearUser()
    window.location.href = '/'
  }

  function handleLockedClick(e: React.MouseEvent) {
    e.preventDefault()
    setGuestToast(true)
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
    <div className="flex h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>

      {/* ── Guest toast ── */}
      {guestToast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: '#1E293B', color: '#fff',
          padding: '12px 20px', borderRadius: '12px',
          fontSize: '13px', fontWeight: 500,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <LockIcon />
          <span>Create a free account to access this feature</span>
          <Link href="/register" prefetch={false} style={{ color: '#60A5FA', fontWeight: 700, marginLeft: '6px' }}>Sign up →</Link>
        </div>
      )}

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ════════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════════ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200
          ${sidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!sidebarOpen && 'lg:hidden'}`}
        style={{ width: '264px', flexShrink: 0, background: SIDEBAR_BG, color: MUTED_COLOR, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
      >

        {/* ── Logo ── */}
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${SIDEBAR_BORDER}`, flexShrink: 0 }}>
          <Link href="/home" prefetch={false} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <LogoIcon />
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Med<span style={{ color: '#60A5FA' }}>Navigator</span>
            </span>
          </Link>
        </div>

        {/* ── User / Guest card ── */}
        <div style={{ padding: '12px 12px 4px', flexShrink: 0 }}>
          {isLoading ? (
            <div style={{ padding: '12px', borderRadius: '13px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${SIDEBAR_BORDER}` }}>
              <div style={{ height: '11px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', marginBottom: '8px', width: '55%' }} />
              <div style={{ height: '9px', borderRadius: '5px', background: 'rgba(255,255,255,0.05)', width: '75%' }} />
            </div>
          ) : isGuest ? (
            <div style={{ borderRadius: '13px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${SIDEBAR_BORDER}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px 8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', letterSpacing: '.06em', marginBottom: '4px' }}>BROWSING AS GUEST</div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>Sign up to track progress and save bookmarks.</div>
              </div>
              <Link href="/register" prefetch={false} style={{
                display: 'block', textAlign: 'center', padding: '9px',
                background: '#2563EB', color: '#fff',
                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                borderTop: `1px solid ${SIDEBAR_BORDER}`,
              }}>
                Create Free Account →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '12px', borderRadius: '13px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${SIDEBAR_BORDER}` }}>
              {/* Avatar */}
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(140deg, rgb(91, 140, 255), rgb(47, 107, 255))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z"/></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name ?? 'Student'}</div>
                <div style={{ fontSize: '11.5px', color: MUTED_COLOR, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email ?? ''}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', scrollbarWidth: 'none' }}>

          {/* EXPLORE */}
          <div style={firstSectionLabel}>EXPLORE</div>

          {/* All Universities */}
          <Link href="/explore" prefetch={false} style={navItemStyle(pathname === '/explore')}>
            {pathname === '/explore' && <ActiveBar />}
            <span style={{ color: iconColor(pathname === '/explore') }}><ExploreIcon /></span>
            All Universities
          </Link>

          {/* Universities list */}
          {universities.length > 0 && (
            <>
              <button
                onClick={() => setExploreOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px 5px', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#60A5FA' }}>Universities ({universities.length})</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform .2s', transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {exploreOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '8px' }}>
                  {universities.map((uni) => {
                    const uniPath = uni.slug ?? uni.id
                    const active  = pathname.startsWith(`/${uniPath}`)
                    return (
                      <Link key={uni.id} href={`/${uniPath}`} prefetch={false} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '9px',
                        fontSize: '13px', fontWeight: active ? 600 : 400,
                        color: active ? ACTIVE_COLOR : '#64748B',
                        textDecoration: 'none',
                        background: active ? ACTIVE_BG : 'transparent',
                        transition: 'background .15s, color .15s',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: active ? ACTIVE_BAR : '#334155' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* LEARNING */}
          <div style={sectionLabel}>LEARNING</div>

          {studentNavItems.map((item) => {
            if (item.href === '__my_uni__') {
              if (isGuest) {
                return (
                  <a key="my-university" href="#" onClick={handleLockedClick} style={navItemStyle(false, true)}>
                    <span style={{ color: iconColor(false, true) }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>My University</span>
                    <LockIcon />
                  </a>
                )
              }
              const uniHref = myUniSlug ? `/${myUniSlug}` : '/home'
              const active  = myUniSlug ? pathname.startsWith(`/${myUniSlug}`) : false
              return (
                <Link key="my-university" href={uniHref} prefetch={false} style={navItemStyle(active)}>
                  {active && <ActiveBar />}
                  <span style={{ color: iconColor(active) }}>{item.icon}</span>
                  My University
                </Link>
              )
            }

            const isLocked = isGuest && GUEST_LOCKED_ROUTES.includes(item.href)
            if (isLocked) {
              return (
                <a key={item.label} href="#" onClick={handleLockedClick} style={navItemStyle(false, true)}>
                  <span style={{ color: iconColor(false, true) }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <LockIcon />
                </a>
              )
            }

            const active = isActive(item.href)
            return (
              <Link key={item.label} href={item.href} prefetch={false} style={navItemStyle(active)}>
                {active && <ActiveBar />}
                <span style={{ color: iconColor(active) }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {/* OTHER */}
          <div style={sectionLabel}>OTHER</div>

          {studentOtherItems.map((item) => {
            const isLocked = isGuest && GUEST_LOCKED_ROUTES.includes(item.href)
            if (isLocked) {
              return (
                <a key={item.label} href="#" onClick={handleLockedClick} style={navItemStyle(false, true)}>
                  <span style={{ color: iconColor(false, true) }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <LockIcon />
                </a>
              )
            }
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} prefetch={false} style={navItemStyle(active)}>
                {active && <ActiveBar />}
                <span style={{ color: iconColor(active) }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {/* Guest sign in prompt */}
          {isGuest && (
            <div style={{ margin: '14px 4px 0', padding: '14px', borderRadius: '12px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' }}>
              <div style={{ fontSize: '12px', color: MUTED_COLOR, marginBottom: '8px', lineHeight: 1.5 }}>
                Already have an account?
              </div>
              <Link href="/login" prefetch={false} style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          )}

        </nav>

        {/* ── Logout ── */}
        {!isGuest && (
          <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: '10px 12px', flexShrink: 0 }}>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '11px', fontSize: '14px', fontWeight: 600, color: '#F87171', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', fontFamily: 'inherit', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* ════════════════════════════════════════════════════════
          MAIN AREA
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top Bar ── */}
        <header style={{
          height: '68px', flexShrink: 0,
          background: 'rgba(248,250,252,0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', gap: '14px', padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 20,
        }}>

          {/* Sidebar toggle */}
          <button
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => { if (window.innerWidth >= 1024) setSidebarOpen(!sidebarOpen); else setMobileOpen(!mobileOpen) }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
            <svg style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Search lectures, sheets, quizzes..."
              style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', padding: '0 14px 0 38px', fontFamily: 'inherit', fontSize: '14px', color: '#0F172A', outline: 'none' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (isGuest) { setGuestToast(true); return }
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val) router.push(`/search?q=${encodeURIComponent(val)}`)
                }
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {isGuest ? (
            <Link href="/register" prefetch={false} style={{ display: 'flex', alignItems: 'center', height: '40px', padding: '0 18px', borderRadius: '10px', background: '#2563EB', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Sign Up Free
            </Link>
          ) : (
            <>
              {/* Notifications bell */}
              <Link href="/notifications" prefetch={false} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', flexShrink: 0, textDecoration: 'none' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </Link>

              {/* Profile chip + dropdown */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 8px 0 5px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer', flexShrink: 0 }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(140deg, rgb(91, 140, 255), rgb(47, 107, 255))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z"/></svg>
                  </div>
                  <svg style={{ color: '#94A3B8', transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {profileOpen && (
                  <>
                    {/* Backdrop */}
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setProfileOpen(false)} />

                    {/* Dropdown */}
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, width: '240px', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

                      {/* User info */}
                      <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(140deg, rgb(91, 140, 255), rgb(47, 107, 255))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z"/></svg>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name ?? 'Student'}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{user?.email ?? ''}</div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div style={{ padding: '8px' }}>
                        <Link href="/profile" prefetch={false} onClick={() => setProfileOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: '#1E293B', textDecoration: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20a7.4 7.4 0 0 1 14.8 0z"/></svg>
                          My Profile
                        </Link>










                        <Link href="/help" prefetch={false} onClick={() => setProfileOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: '#1E293B', textDecoration: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Help Center
                        </Link>
                      </div>

                      {/* Logout */}
                      <div style={{ padding: '8px', borderTop: '1px solid #F1F5F9' }}>
                        <button onClick={() => { setProfileOpen(false); handleLogout() }}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#EF4444', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', fontFamily: 'inherit', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Logout
                        </button>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="lg:hidden flex-shrink-0 border-t flex items-center justify-around px-2 py-1"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          {[
            { label: 'Home',      href: '/home' },
            { label: 'Explore',   href: '/explore' },
            { label: 'Bookmarks', href: '/bookmarks' },
            { label: 'Alerts',    href: '/notifications' },
          ].map((item) => {
            const isLocked = isGuest && GUEST_LOCKED_ROUTES.includes(item.href)
            if (isLocked) {
              return (
                <button key={item.href} onClick={handleLockedClick}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium"
                  style={{ color: '#CBD5E1' }}>
                  {item.label}
                </button>
              )
            }
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} prefetch={false}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium"
                style={{ color: active ? '#2563EB' : '#94A3B8' }}>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}


