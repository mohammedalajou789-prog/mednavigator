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
  { label: 'Dashboard', href: '/home', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> },
  { label: 'My University', href: '__my_uni__', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'My Progress', href: '/progress', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label: 'Bookmarks', href: '/bookmarks', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
  { label: 'Notes', href: '/notes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
]

const studentOtherItems = [
  { label: 'Notifications', href: '/notifications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> },
  { label: 'Settings', href: '/settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { label: 'Help Center', href: '/help', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
]

const ExploreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function navLinkStyle(active: boolean, locked = false): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
    borderRadius: '11px', fontSize: '14px', fontWeight: active ? 600 : 500,
    color: locked ? '#4A5568' : active ? '#EAF0FF' : '#9AA7C4',
    cursor: locked ? 'pointer' : 'pointer', textDecoration: 'none',
    background: active ? 'rgba(76,130,255,.16)' : 'transparent',
    boxShadow: active ? 'inset 0 0 0 1px rgba(120,160,255,.2)' : 'none',
    transition: 'background .15s, color .15s',
    opacity: locked ? 0.6 : 1,
  }
}

function iconStyle(active: boolean, locked = false): React.CSSProperties {
  return { color: locked ? '#4A5568' : active ? '#6E9BFF' : '#7C89A8', flexShrink: 0 }
}

const sectionLabel: React.CSSProperties = {
  fontSize: '10.5px', fontWeight: 700, letterSpacing: '.14em',
  color: '#56648A', padding: '16px 12px 6px',
}

const firstSectionLabel: React.CSSProperties = {
  fontSize: '10.5px', fontWeight: 700, letterSpacing: '.14em',
  color: '#56648A', padding: '8px 12px 6px',
}

export default function StudentLayout({ children, universities = [], myUniSlug }: StudentLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, clearUser } = useUserStore()
  useUser()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [guestToast, setGuestToast] = useState(false)

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
  }, [setSidebarOpen])

  useEffect(() => {
    const onUniPage = universities.some(u => pathname.startsWith(`/${u.id}`))
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
    <div className="flex h-screen" style={{ background: '#F5F6FA', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>

      {/* Guest toast notification */}
      {guestToast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: '#1E293B', color: '#fff',
          padding: '12px 20px', borderRadius: '12px',
          fontSize: '13px', fontWeight: 500,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'fadeIn .2s ease',
        }}>
          <LockIcon />
          <span>Create a free account to access this feature</span>
          <a href="/register" style={{ color: '#6E9BFF', fontWeight: 700, marginLeft: '6px' }}>Sign up →</a>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200 ${sidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${!sidebarOpen && 'lg:hidden'}`}
        style={{ width: '266px', flexShrink: 0, background: 'linear-gradient(185deg,#121E3E 0%,#0C152F 100%)', padding: '22px 16px 18px', color: '#9AA7C4' }}
      >
        {/* Logo */}
        <div style={{ padding: '0 6px 18px', display: 'flex', alignItems: 'center' }}>
          <a href="/home">
            <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>
              Med<span style={{ color: '#9FB8F2' }}>Navigator</span>
            </span>
          </a>
        </div>

        {/* User card or Guest card */}
        {isLoading ? (
  <div style={{ marginBottom: '18px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
    <div style={{ height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,.08)', marginBottom: '8px', width: '60%' }} />
    <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,.05)', width: '80%' }} />
  </div>
) : isGuest ? (
  <div style={{ marginBottom: '18px', borderRadius: '14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 14px 10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9FB8F2', letterSpacing: '.06em', marginBottom: '4px' }}>BROWSING AS GUEST</div>
              <div style={{ fontSize: '12px', color: '#6E7A94', lineHeight: 1.5 }}>Sign up to track progress, save bookmarks, and more.</div>
            </div>
            <a href="/register" style={{
              display: 'block', textAlign: 'center', padding: '10px',
              background: 'linear-gradient(135deg,#3B6FFF,#2F56D6)',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              textDecoration: 'none', letterSpacing: '.02em',
              borderTop: '1px solid rgba(255,255,255,.06)',
            }}>
              Create Free Account →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 10px', marginBottom: '18px', borderRadius: '14px', background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(140deg,#5B8CFF,#2F6BFF)', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#EAF0FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name ?? 'Student'}</div>
              <div style={{ fontSize: '11.5px', color: '#7C89A8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email ?? ''}</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', scrollbarWidth: 'none' }}>

          {/* EXPLORE */}
          <div style={firstSectionLabel}>EXPLORE</div>

          <a href="/explore" style={navLinkStyle(pathname === '/explore')}>
            <span style={iconStyle(pathname === '/explore')}><ExploreIcon /></span>
            All Universities
          </a>

          {universities.length > 0 && (
            <>
              <button
                onClick={() => setExploreOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '11px', fontSize: '12px', fontWeight: 500, color: '#7C89A8', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', fontFamily: 'inherit' }}
              >
                <span>Universities ({universities.length})</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform .2s', transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {exploreOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '8px' }}>
                  {universities.map((uni) => {
                    const uniPath = uni.slug ?? uni.id
                    const active = pathname.startsWith(`/${uniPath}`)
                    return (
                      <a key={uni.id} href={`/${uniPath}`} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                        borderRadius: '9px', fontSize: '13px', fontWeight: active ? 600 : 400,
                        color: active ? '#EAF0FF' : '#6E7A94', textDecoration: 'none',
                        background: active ? 'rgba(76,130,255,.14)' : 'transparent',
                        transition: 'background .15s, color .15s',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: active ? '#6E9BFF' : '#3D4E6B' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</span>
                      </a>
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
                  <a key="my-university" href="#" onClick={handleLockedClick} style={navLinkStyle(false, true)}>
                    <span style={iconStyle(false, true)}>{item.icon}</span>
                    <span style={{ flex: 1 }}>My University</span>
                    <LockIcon />
                  </a>
                )
              }
              const uniHref = myUniSlug ? `/${myUniSlug}` : '/home'
              const active = myUniSlug ? pathname.startsWith(`/${myUniSlug}`) : false
              return (
                <a key="my-university" href={uniHref} style={navLinkStyle(active)}>
                  <span style={iconStyle(active)}>{item.icon}</span>
                  My University
                </a>
              )
            }

            const isLocked = isGuest && GUEST_LOCKED_ROUTES.includes(item.href)
            if (isLocked) {
              return (
                <a key={item.label} href="#" onClick={handleLockedClick} style={navLinkStyle(false, true)}>
                  <span style={iconStyle(false, true)}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <LockIcon />
                </a>
              )
            }

            const active = isActive(item.href)
            return (
              <a key={item.label} href={item.href} style={navLinkStyle(active)}>
                <span style={iconStyle(active)}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}

          {/* OTHER */}
          <div style={sectionLabel}>OTHER</div>

          {studentOtherItems.map((item) => {
            const isLocked = isGuest && GUEST_LOCKED_ROUTES.includes(item.href)
            if (isLocked) {
              return (
                <a key={item.label} href="#" onClick={handleLockedClick} style={navLinkStyle(false, true)}>
                  <span style={iconStyle(false, true)}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <LockIcon />
                </a>
              )
            }
            const active = isActive(item.href)
            return (
              <a key={item.href} href={item.href} style={navLinkStyle(active)}>
                <span style={iconStyle(active)}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}

          {/* Guest login prompt */}
          {isGuest && (
            <div style={{ margin: '16px 4px 0', padding: '14px', borderRadius: '12px', background: 'rgba(110,155,255,.08)', border: '1px solid rgba(110,155,255,.15)' }}>
              <div style={{ fontSize: '12px', color: '#9AA7C4', marginBottom: '8px', lineHeight: 1.5 }}>
                Already have an account?
              </div>
              <a href="/login" style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '1px solid rgba(110,155,255,.3)', color: '#9FB8F2', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </a>
            </div>
          )}

        </nav>

        {/* Logout or nothing for guest */}
        {!isGuest && (
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', marginTop: '8px', borderRadius: '11px', fontSize: '14px', fontWeight: 600, color: '#FF8C8C', cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', fontFamily: 'inherit', borderTop: '1px solid rgba(255,255,255,.06)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        )}
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header style={{ height: '72px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #EBEDF3', display: 'flex', alignItems: 'center', gap: '18px', padding: '0 26px' }}>
          <button
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '11px', background: '#F4F5F8', border: '1px solid #EBEDF3', color: '#5B6678', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => { if (window.innerWidth >= 1024) setSidebarOpen(!sidebarOpen); else setMobileOpen(!mobileOpen) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>

          <div style={{ flex: 1, maxWidth: '560px', display: 'flex', alignItems: 'center', gap: '11px', height: '42px', padding: '0 16px', borderRadius: '12px', background: '#F4F5F8', border: '1px solid #EBEDF3' }}>
            <svg style={{ flexShrink: 0, color: '#9AA3B2' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Search lectures, sheets, quizzes..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: '14px', color: '#1B2335' }}
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
          <ThemeToggle />

          {isGuest ? (
            <a href="/register" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '20px', background: 'linear-gradient(135deg,#3B6FFF,#2F56D6)', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Sign Up Free
            </a>
          ) : (
            <>
              <a href="/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '11px', background: '#F4F5F8', border: '1px solid #EBEDF3', color: '#5B6678', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </a>
              <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 8px 0 6px', borderRadius: '24px', background: '#F4F5F8', border: '1px solid #EBEDF3', cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(140deg,#5B8CFF,#2F6BFF)', color: '#fff', fontSize: '12px', fontWeight: 700 }}>
                  {initials}
                </div>
                <svg style={{ color: '#8A93A6' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </a>
            </>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <nav className="lg:hidden flex-shrink-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1">
          {[
            { label: 'Home', href: '/home' },
            { label: 'Explore', href: '/explore' },
            { label: 'Bookmarks', href: '/bookmarks' },
            { label: 'Alerts', href: '/notifications' },
          ].map((item) => {
            const isLocked = isGuest && GUEST_LOCKED_ROUTES.includes(item.href)
            if (isLocked) {
              return (
                <button key={item.href} onClick={handleLockedClick}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-medium text-slate-300`}>
                  {item.label}
                </button>
              )
            }
            return (
              <a key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-medium ${pathname.startsWith(item.href) ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.label}
              </a>
            )
          })}
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
    <button onClick={cycle}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '11px', background: '#F4F5F8', border: '1px solid #EBEDF3', color: '#5B6678', cursor: 'pointer', flexShrink: 0 }}
      aria-label={`Theme: ${theme}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {theme === 'dark'
          ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          : <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
        }
      </svg>
    </button>
  )
}