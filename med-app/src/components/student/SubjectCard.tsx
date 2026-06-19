import Link from 'next/link'
import type { Subject } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface SubjectCardProps {
  subject: Subject
  universityId: string
}

const TYPE_LABELS = { standard: 'Standard', system: 'System', clinical: 'Clinical' } as const
const TYPE_COLORS = {
  standard: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  system: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  clinical: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
} as const
const ACCESS_BADGES = {
  free: { label: 'Free', className: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  premium: { label: 'Premium', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  mixed: { label: 'Mixed', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
} as const

export default function SubjectCard({ subject, universityId }: SubjectCardProps) {
  const typeLabel = TYPE_LABELS[subject.subject_type] ?? subject.subject_type
  const typeColor = TYPE_COLORS[subject.subject_type] ?? TYPE_COLORS.standard
  const accessBadge = ACCESS_BADGES[subject.access_mode as keyof typeof ACCESS_BADGES] ?? ACCESS_BADGES.free
  const isPremium = subject.access_mode === 'premium'

  return (
    <Link href={`/${universityId}/${subject.id}`} className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all">
      {isPremium && (
        <div className="absolute top-4 right-4 text-amber-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', typeColor)}>{typeLabel}</span>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', accessBadge.className)}>{accessBadge.label}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">{subject.name}</h3>
      {subject.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{subject.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400">{subject.price > 0 ? `${subject.price} JOD` : 'Free access'}</span>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  )
}