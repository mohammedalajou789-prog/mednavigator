'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV_GROUPS = [
  {
    label: 'Learning',
    items: [
      { label: 'Dashboard', href: '/home' },
      { label: 'My Subjects', href: '/home' },
      { label: 'Bookmarks', href: '/bookmarks' },
      { label: 'Notifications', href: '/notifications' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/profile' },
      { label: 'Subscriptions', href: '/subscriptions' },
    ],
  },
]

interface StudentSidebarProps {
  fullName: string
  universityName: string
}

export default function StudentSidebar({ fullName, universityName }: StudentSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1E293B] text-white flex flex-col fixed top-0 left-0 h-full z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700 gap-3">
        <span className="text-lg font-bold">
          <span className="text-blue-400">Med</span>
          <span className="text-white">Navigator</span>
        </span>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-slate-700">
        <p className="text-sm font-medium text-white truncate">{fullName}</p>
        <p className="text-xs text-slate-400 truncate">{universityName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="px-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        'flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors',
                        active
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700 p-3">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}