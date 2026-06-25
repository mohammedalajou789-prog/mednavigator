import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/services/user'

export default async function SubscriptionsPage() {
  const supabase = await createServerClient()

  const profile = await requireAuth()

  const { data: subscriptions } = await supabase
    .from('subject_subscriptions')
    .select(`
      id, status, start_date, end_date,
      subject:subjects ( id, name, subject_type, access_mode, university_id,
        university:universities ( id, name )
      )
    `)
    .eq('user_id', profile.id)
    .order('end_date', { ascending: true })

  function getDaysRemaining(endDate: string): number {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const active = subscriptions?.filter(s => s.status === 'active') ?? []
  const expired = subscriptions?.filter(s => s.status !== 'active') ?? []

  return (
    <div className="p-6 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Subscriptions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your access to premium subjects
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{subscriptions?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Active</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{active.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Expired</p>
          <p className="text-2xl font-semibold text-red-500 dark:text-red-400">{expired.length}</p>
        </div>
      </div>

      {/* Active subscriptions */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Active — {active.length}
        </h2>

        {active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center">
            <p className="text-3xl mb-3">🔓</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No active subscriptions</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Contact support to activate access to premium subjects.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(sub => {
              const days = getDaysRemaining(sub.end_date)
              const isExpiringSoon = days <= 7
              const subject = sub.subject as any
              const typeMap: Record<string, string> = {
                standard: 'Standard',
                system: 'System',
                clinical: 'Clinical',
              }
              const typeColors: Record<string, string> = {
                standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                system: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                clinical: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
              }
              return (
                <div
                  key={sub.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400 text-lg font-bold">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {subject?.name ?? 'Unknown'}
                        </p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeColors[subject?.subject_type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {typeMap[subject?.subject_type] ?? subject?.subject_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {subject?.university?.name ?? ''} &middot; Started{' '}
                        {new Date(sub.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        &middot; Expires{' '}
                        {new Date(sub.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-lg font-bold ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                      {days}d
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">remaining</p>
                    {isExpiringSoon && (
                      <p className="text-xs text-amber-500 mt-0.5 font-medium">Expiring soon</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Expired / Revoked */}
      {expired.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Expired / Revoked — {expired.length}
          </h2>
          <div className="space-y-3">
            {expired.map(sub => {
              const subject = sub.subject as any
              return (
                <div
                  key={sub.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-5 flex items-center justify-between gap-4 opacity-60"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-lg">
                      🔒
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {subject?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {subject?.university?.name ?? ''} &middot; Ended{' '}
                        {new Date(sub.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-3 py-1 rounded-full ${
                    sub.status === 'expired'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {sub.status === 'expired' ? 'Expired' : 'Revoked'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Support note */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-6 py-5 flex items-start gap-4">
        <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-lg">
          💬
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Need access to a subject?</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            Contact support via WhatsApp to activate your subscription after completing payment.
          </p>
        </div>
      </div>

    </div>
  )
}