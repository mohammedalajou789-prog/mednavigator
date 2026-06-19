'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { University } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface LandingNavbarProps {
  universities: University[]
}

export default function LandingNavbar({ universities }: LandingNavbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleUniversitySelect(universityId: string) {
    setDropdownOpen(false)
    router.push(`/${universityId}`)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          <span className="text-blue-600">Med</span>
          <span className="text-gray-900 dark:text-white">Navigator</span>
        </Link>

        <div className="relative hidden sm:block">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-gray-300 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            Select your university
            <svg className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', dropdownOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
              {universities.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  No universities available yet.
                </div>
              ) : (
                <div className="py-1 max-h-64 overflow-y-auto">
                  {universities.map((uni) => (
                    <button
                      key={uni.id}
                      onClick={() => handleUniversitySelect(uni.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      {uni.logo_url ? (
                        <img src={uni.logo_url} alt={uni.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-[9px] font-bold">
                            {uni.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="truncate">{uni.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Register
          </Link>
        </div>
      </div>
    </nav>
  )
}