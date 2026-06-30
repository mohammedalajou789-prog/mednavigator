'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  fullName: string
  role: string
}

export default function AdminSidebar({ fullName, role }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-0 overflow-hidden' : 'w-56'} bg-[#1E293B] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between min-w-[224px]">
          <div>
            <span className="text-lg font-bold text-white">MedNavigator</span>
            <span className="ml-2 text-xs text-blue-400 font-medium">Admin</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-white transition-colors ml-2"
            title="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/10 min-w-[224px]">
          <p className="text-sm font-medium text-white truncate">{fullName}</p>
          <p className="text-xs text-gray-400 capitalize">{role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 min-w-[224px]">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/subjects" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            My Subjects
          </Link>
          <Link href="/admin/subscribers" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            Subscribers
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            Analytics
          </Link>
          <Link href="/admin/docs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            Documentation
          </Link>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1 min-w-[224px]">
          {role === 'owner' && (
            <Link href="/owner" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-white/10 transition-colors">
              ← Owner Dashboard
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/10 transition-colors">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Toggle button — shows when sidebar is collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed top-4 left-3 z-50 bg-[#1E293B] text-white p-2 rounded-lg shadow-lg hover:bg-[#2d3f55] transition-colors"
          title="Open sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </>
  )
}