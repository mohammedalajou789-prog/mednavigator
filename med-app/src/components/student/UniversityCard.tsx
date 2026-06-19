import Link from 'next/link'
import type { University } from '@/types/database'

interface UniversityCardProps {
  university: University
}

export default function UniversityCard({ university }: UniversityCardProps) {
  const initials = university.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Link
      href={`/${university.id}`}
      className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
    >
      <div className="flex justify-center mb-3">
        {university.logo_url ? (
          <img
            src={university.logo_url}
            alt={university.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">
              {initials}
            </span>
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">
        {university.name}
      </h3>

      <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        Resources available
      </p>
    </Link>
  )
}