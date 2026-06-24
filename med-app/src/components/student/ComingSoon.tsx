import Link from 'next/link'

interface ComingSoonProps {
  title: string
  description: string
  icon: string
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-4">
        <i className={`ti ${icon} text-3xl text-blue-600 dark:text-blue-400`} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full mb-6">
        <i className="ti ti-clock text-[13px]" aria-hidden="true" />
        Coming Soon
      </span>
      <Link href="/home" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  )
}