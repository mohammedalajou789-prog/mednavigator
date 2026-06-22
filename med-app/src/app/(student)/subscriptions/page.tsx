import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SubscriptionsPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

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
    <div className="p-6 max-w-4xl">

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Subscriptions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your access to premium subjects
        </p>
      </div>

      {/* Active */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Active — {active.length}
        </h2>

        {active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <p className="text-2xl mb-2">🔓</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No active subscriptions.</p>
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
              return (
                <div key={sub.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 text-lg">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {subject?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {subject?.university?.name ?? ''} &middot; Expires{' '}
                        {new Date(sub.end_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-sm font-semibold ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                      {days}d left
                    </span>
                    {isExpiringSoon && (
                      <p className="text-xs text-amber-500 mt-0.5">Expiring soon</p>
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
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Expired / Revoked — {expired.length}
          </h2>
          <div className="space-y-3">
            {expired.map(sub => {
              const subject = sub.subject as any
              return (
                <div key={sub.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 flex items-center justify-between gap-4 opacity-60">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-lg">
                      🔒
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {subject?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {subject?.university?.name ?? ''} &middot; Ended{' '}
                        {new Date(sub.end_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-md ${
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
      <div className="mt-8 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-5 py-4">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Need access to a subject?</p>
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
          Contact support via WhatsApp to activate your subscription after payment.
        </p>
      </div>

    </div>
  )
}