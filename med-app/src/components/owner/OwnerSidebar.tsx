'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { label: 'Overview', href: '/owner' },
  { label: 'Universities', href: '/owner/universities' },
  { label: 'University Requests', href: '/owner/university-requests' },
  { label: 'Subjects', href: '/owner/subjects' },
  { label: 'Admins', href: '/owner/admins' },
  { label: 'Users', href: '/owner/users' },
  { label: 'Subscriptions', href: '/owner/subscriptions' },
  { label: 'Notifications', href: '/owner/notifications' },
  { label: 'Analytics', href: '/owner/analytics' },
  { label: 'Settings', href: '/owner/settings' },
]

interface OwnerSidebarProps {
  fullName: string
}

export default function OwnerSidebar({ fullName }: OwnerSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1E293B] text-white flex flex-col fixed top-0 left-0 h-full z-40">
      <div className="h-16 flex items-center px-6 border-b border-slate-700 gap-3">
        <span className="text-lg font-bold">
          <span className="text-blue-400">Med</span>
          <span className="text-white">Navigator</span>
        </span>
        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">Owner</span>
      </div>

      <div className="px-4 py-3 border-b border-slate-700">
        <p className="text-sm font-medium text-white truncate">{fullName}</p>
        <p className="text-xs text-slate-400">Platform Administrator</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
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
      </nav>

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
