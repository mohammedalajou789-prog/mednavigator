'use client'

interface LockedContentCardProps {
  subjectName?: string
  contentType?: 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years' | 'video'
}

const contentTypeLabels: Record<string, string> = {
  sheet: 'Sheet',
  summary: 'Summary',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  previous_years: 'Previous Years Questions',
  video: 'Video Lecture',
}

export default function LockedContentCard({
  subjectName,
  contentType,
}: LockedContentCardProps) {
  const label = contentType ? contentTypeLabels[contentType] : 'Content'

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
        {label} — Access Required
      </h2>

      {subjectName && (
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
          {subjectName}
        </p>
      )}

      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-3 leading-relaxed">
        This content requires an active subscription. To get access, complete
        the payment and contact support to activate your subscription.
      </p>

      <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 max-w-xs w-full">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
          How to get access
        </p>
        <ol className="text-left space-y-1 list-decimal list-inside">
          <li>Complete the payment</li>
          <li>Send proof via WhatsApp</li>
          <li>Your subscription will be activated</li>
        </ol>
      </div>
    </div>
  )
}