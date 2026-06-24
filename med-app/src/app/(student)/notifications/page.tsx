import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, default_university_id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, notification_reads(id, user_id)')
    .or(`target_type.eq.all,and(target_type.eq.user,user_id.eq.${profile?.id})`)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const PRIORITY_STYLES: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-600',
    important: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  }

  const PRIORITY_ICONS: Record<string, string> = {
    normal: '💬',
    important: '⚠️',
    critical: '🚨',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Notifications</h1>
        <p className="text-[#64748B] mt-1">{notifications?.length ?? 0} notifications</p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-lg font-medium text-[#0F172A]">No notifications yet</p>
          <p className="text-[#64748B] mt-1 text-sm">You will be notified of important updates here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const reads = notif.notification_reads as Record<string, unknown>[] ?? []
            const isRead = reads.some(r => r.user_id === profile?.id)
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border p-4 shadow-sm ${
                  !isRead ? 'border-l-4 border-l-[#2563EB] border-[#E2E8F0]' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {PRIORITY_ICONS[notif.priority] ?? '💬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[#0F172A]">{notif.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[notif.priority] ?? PRIORITY_STYLES.normal}`}>
                        {notif.priority}
                      </span>
                      {!isRead && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span>
                      )}
                    </div>
                    <p className="text-[#64748B] text-sm leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-[#64748B] mt-2">
                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }) : ''}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}