'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

// ── Types ──────────────────────────────────────────────────────────────────

interface University {
  id: string
  name: string
}

interface StudentSidebarProps {
  fullName: string
  universityName: string
  universities?: University[]
}

// ── Icons ──────────────────────────────────────────────────────────────────

const IconCompass = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
)
const IconDashboard = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
)
const IconBook = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)
const IconProgress = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)
const IconBookmark = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconNote = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
    <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
)
const IconBell = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
)
const IconSettings = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconHelp = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconLogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

// ── Nav groups ─────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'Learning',
    items: [
      { label: 'Dashboard',     href: '/home',          icon: IconDashboard },
      { label: 'My University', href: '/home',          icon: IconBook },
      { label: 'My Progress',   href: '/progress',      icon: IconProgress },
      { label: 'Bookmarks',     href: '/bookmarks',     icon: IconBookmark },
      { label: 'Notes',         href: '/notes',         icon: IconNote },
    ],
  },
  {
    label: 'Other',
    items: [
      { label: 'Notifications', href: '/notifications', icon: IconBell },
      { label: 'Settings',      href: '/settings',      icon: IconSettings },
      { label: 'Help Center',   href: '/help',          icon: IconHelp },
    ],
  },
]

// ── Logo ───────────────────────────────────────────────────────────────────

const MedNavigatorLogo = () => (
  <div className="flex items-center gap-2.5">
    {/* pulse icon */}
    <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    </div>
    <span className="text-[17px] font-bold tracking-tight text-white">
      Med<span className="text-[#60A5FA]">Navigator</span>
    </span>
  </div>
)

// ── Component ──────────────────────────────────────────────────────────────

export default function StudentSidebar({ fullName, universityName, universities = [] }: StudentSidebarProps) {
  const pathname = usePathname()

  // initials for avatar
  const initials = fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="w-64 flex flex-col fixed top-0 left-0 h-full z-40"
      style={{ background: '#0D1B2A', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <MedNavigatorLogo />
      </div>

      {/* ── User card ── */}
      <div className="mx-3 my-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ background: '#2563EB' }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-white truncate leading-tight">{fullName}</p>
            <p className="text-[11.5px] truncate leading-tight" style={{ color: '#94A3B8' }}>{universityName}</p>
          </div>
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Explore section */}
        <div className="mb-3">
          <p className="px-3 mb-1.5 text-[10.5px] font-bold tracking-widest uppercase"
            style={{ color: '#94A3B8' }}>
            Explore
          </p>

          {/* All Universities */}
          <Link
            href="/explore"
            prefetch={false}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mb-0.5',
              pathname === '/explore'
                ? 'text-white'
                : 'hover:text-white'
            )}
            style={pathname === '/explore' ? {
              background: 'rgba(37,99,235,0.18)',
              color: '#F1F5F9',
            } : { color: '#94A3B8' }}
          >
            {pathname === '/explore' && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#60A5FA]" />
            )}
            <IconCompass />
            All Universities
          </Link>

          {/* Universities list */}
          {universities.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-2 mt-1">
                <span className="text-[12.5px] font-semibold" style={{ color: '#60A5FA' }}>
                  Universities ({universities.length})
                </span>
                <IconChevronDown />
              </div>
              <div className="space-y-0.5">
                {universities.map((uni) => {
                  const active = pathname.startsWith(`/${uni.id}`)
                  return (
                    <Link
                      key={uni.id}
                      href={`/${uni.id}`}
                      prefetch={false}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors ml-2',
                        active ? 'text-white' : 'hover:text-white'
                      )}
                      style={active ? { color: '#F1F5F9' } : { color: '#94A3B8' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: active ? '#60A5FA' : '#475569' }} />
                      <span className="truncate font-medium">{uni.name}</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Nav groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 mb-1.5 text-[10.5px] font-bold tracking-widest uppercase"
              style={{ color: '#94A3B8' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      active ? 'text-white' : 'hover:text-white'
                    )}
                    style={active ? {
                      background: 'rgba(37,99,235,0.18)',
                      color: '#F1F5F9',
                    } : { color: '#94A3B8' }}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#60A5FA]" />
                    )}
                    <Icon />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

      </nav>

      {/* ── Logout ── */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5"
          style={{ color: '#F87171' }}
        >
          <IconLogout />
          Logout
        </button>
      </div>

    </aside>
  )
}