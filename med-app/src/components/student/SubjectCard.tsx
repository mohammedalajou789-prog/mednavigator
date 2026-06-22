import Link from 'next/link'
import type { Subject } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface SubjectCardProps {
  subject: Subject
  universityId: string
}

const TYPE_COLORS = {
  standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  system: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  clinical: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
} as const

const ACCESS_BADGES = {
  free: { label: 'Free', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  premium: { label: 'Premium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  mixed: { label: 'Mixed', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
} as const

export default function SubjectCard({ subject, universityId }: SubjectCardProps) {
  const typeColor = TYPE_COLORS[subject.subject_type] ?? TYPE_COLORS.standard
  const typeLabel = subject.subject_type.charAt(0).toUpperCase() + subject.subject_type.slice(1)
  const accessBadge = ACCESS_BADGES[subject.access_mode as keyof typeof ACCESS_BADGES] ?? ACCESS_BADGES.free
  const isPremium = subject.access_mode === 'premium'

  return (
    <Link
      href={`/${universityId}/${subject.id}`}
      className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', typeColor)}>
            {typeLabel}
          </span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', accessBadge.className)}>
            {accessBadge.label}
          </span>
        </div>
        {isPremium && (
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        )}
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug flex-1">
        {subject.name}
      </h3>

      {subject.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
          {subject.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {subject.price > 0 ? `${subject.price} JOD` : 'Free access'}
        </span>
        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  )
}