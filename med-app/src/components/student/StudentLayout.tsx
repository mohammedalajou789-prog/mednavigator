'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { createClient } from '@/lib/supabase/client'

interface StudentLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', href: '/home', icon: 'ti-layout-dashboard' },
  { label: 'My Subjects', href: '/subjects', icon: 'ti-book' },
  { label: 'My Progress', href: '/progress', icon: 'ti-chart-line' },
  { label: 'Bookmarks', href: '/bookmarks', icon: 'ti-bookmark' },
  { label: 'Notes', href: '/notes', icon: 'ti-notes' },
  { label: 'Flashcards', href: '/flashcards', icon: 'ti-cards' },
  { label: 'Notifications', href: '/notifications', icon: 'ti-bell' },
]

const bottomNavItems = [
  { label: 'Settings', href: '/settings', icon: 'ti-settings' },
  { label: 'Help Center', href: '/help', icon: 'ti-help-circle' },
]

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearUser } = useUserStore()
  const { theme, sidebarOpen, setSidebarOpen } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Default sidebar open on desktop, closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
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
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-900">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-[220px] flex flex-col
          bg-[#1E293B]
          transition-transform duration-200
          ${sidebarVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!sidebarOpen && 'lg:hidden'}
        `}
      >
        {/* ── WORDMARK LOGO — text only, no icon ── */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
          <Link href="/home">
            <span className="text-white font-bold text-[1.2rem] tracking-tight select-none">
              Med<span className="text-blue-400">Navigator</span>
            </span>
          </Link>
        </div>

        {/* ── USER PROFILE ── */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-200 text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-[13px] font-medium truncate">
              {user?.full_name ?? 'Student'}
            </p>
            <p className="text-slate-400 text-[11px] truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        {/* ── NAVIGATION ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150
                ${isActive(item.href)
                  ? 'bg-blue-600/20 text-blue-300 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }
              `}
            >
              <i className={`ti ${item.icon} text-[17px] flex-shrink-0`} aria-hidden="true" />
              {item.label}
            </Link>
          ))}

          <div className="my-2 h-px bg-white/10" />

          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150
                ${isActive(item.href)
                  ? 'bg-blue-600/20 text-blue-300 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }
              `}
            >
              <i className={`ti ${item.icon} text-[17px] flex-shrink-0`} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── LOGOUT ── */}
        <div className="px-2 py-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <i className="ti ti-logout text-[17px] flex-shrink-0" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── TOP HEADER ── */}
        <header className="h-[52px] flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 px-4">

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <i className="ti ti-menu-2 text-[20px]" aria-hidden="true" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            className="hidden lg:flex w-8 h-8 items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <i className="ti ti-layout-sidebar text-[18px]" aria-hidden="true" />
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search lectures, sheets, quizzes..."
                className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-blue-300 focus:bg-white dark:focus:bg-slate-600 rounded-lg outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) router.push(`/search?q=${encodeURIComponent(val)}`)
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              aria-label="Notifications"
            >
              <i className="ti ti-bell text-[18px]" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </Link>

            {/* Avatar */}
            <Link href="/profile">
              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                <span className="text-blue-100 text-[11px] font-semibold">{initials}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="lg:hidden flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-2 py-1">
          {[
            { label: 'Home', href: '/home', icon: 'ti-home' },
            { label: 'Subjects', href: '/subjects', icon: 'ti-book' },
            { label: 'Bookmarks', href: '/bookmarks', icon: 'ti-bookmark' },
            { label: 'Alerts', href: '/notifications', icon: 'ti-bell' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all
                ${isActive(item.href) ? 'text-blue-600' : 'text-slate-400'}
              `}
            >
              <i className={`ti ${item.icon} text-[20px]`} aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ── Theme Toggle ────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const icon =
    theme === 'light' ? 'ti-sun' :
    theme === 'dark' ? 'ti-moon' :
    'ti-device-desktop'

  return (
    <button
      onClick={cycle}
      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
      aria-label={`Theme: ${theme}`}
    >
      <i className={`ti ${icon} text-[17px]`} aria-hidden="true" />
    </button>
  )
}