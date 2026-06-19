import type { University } from '@/types/database'

interface UniversityHeaderProps {
  university: University
  subjectCount: number
}

export default function UniversityHeader({ university, subjectCount }: UniversityHeaderProps) {
  const initials = university.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-1">
        {university.logo_url ? (
          <img src={university.logo_url} alt={university.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">{initials}</span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{university.name}</h1>
          <p className="text-sm text-gray-400">{subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'} available</p>
        </div>
      </div>
      {university.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-2xl">{university.description}</p>
      )}
    </div>
  )
}