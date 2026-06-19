'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'ti-home' },
  { label: 'My Subjects', href: '/subjects', icon: 'ti-book' },
  { label: 'My Progress', href: '/progress', icon: 'ti-chart-line' },
  { label: 'Bookmarks', href: '/bookmarks', icon: 'ti-bookmark' },
  { label: 'Notifications', href: '/notifications', icon: 'ti-bell' },
  { label: 'Profile', href: '/profile', icon: 'ti-user' },
]

interface StudentLayoutProps {
  children: React.ReactNode
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, isMobile, setIsMobile } = useUIStore()
  const { user } = useUserStore()

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsMobile, setSidebarOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-40 flex flex-col',
          'bg-slate-800 text-white transition-all duration-200',
          sidebarOpen ? 'w-56' : 'w-0 overflow-hidden',
          !isMobile && 'relative'
        )}
      >
        <div className="h-14 flex items-center px-5 border-b border-slate-700 flex-shrink-0">
          <Link href="/" className="text-base font-bold">
            <span className="text-blue-400">Med</span>
            <span className="text-white">Navigator</span>
          </Link>
        </div>

        {user && (
          <div className="px-4 py-3 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">
                  {user.full_name?.slice(0, 2).toUpperCase() ?? 'MN'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name ?? 'Student'}
                </p>
                <p className="text-xs text-slate-400 truncate">Student</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  )}
                >
                  <i className={cn('ti', item.icon, 'text-base')} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-slate-700 py-3 px-2 flex-shrink-0">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <i className="ti ti-settings text-base" aria-hidden="true" />
            <span>Settings</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-700 transition-colors">
            <i className="ti ti-logout text-base" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className={cn('flex-1 flex flex-col min-w-0', !isMobile && sidebarOpen && 'ml-56')}>
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <i className="ti ti-menu-2 text-lg" aria-hidden="true" />
          </button>

          <div className="flex-1 max-w-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <i className="ti ti-search text-sm text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search lectures, subjects..."
                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Link href="/notifications" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <i className="ti ti-bell text-lg" aria-hidden="true" />
            </Link>
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <i className="ti ti-moon text-lg" aria-hidden="true" />
            </button>
            <Link href="/profile" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <i className="ti ti-user-circle text-lg" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {isMobile && (
          <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around py-2 px-4">
            {[
              { label: 'Home', href: '/', icon: 'ti-home' },
              { label: 'Subjects', href: '/subjects', icon: 'ti-book' },
              { label: 'Bookmarks', href: '/bookmarks', icon: 'ti-bookmark' },
              { label: 'Alerts', href: '/notifications', icon: 'ti-bell' },
              { label: 'More', href: '/profile', icon: 'ti-dots' },
            ].map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 text-[10px]',
                    active ? 'text-blue-600' : 'text-gray-400'
                  )}
                >
                  <i className={cn('ti', item.icon, 'text-xl')} aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}