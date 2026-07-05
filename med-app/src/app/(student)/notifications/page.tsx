import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function markAsRead(notificationId: string, userId: string) {
  'use server'
  const supabase = await createServerClient()
  await supabase.from('notification_reads').upsert({
    notification_id: notificationId,
    user_id: userId,
    read_at: new Date().toISOString(),
  }, { onConflict: 'notification_id,user_id' })
  revalidatePath('/notifications')
}

export default async function NotificationsPage() {
  const supabase = await createServerClient()
  const profile = await requireAuth()

  // ── Lazy expiry check: runs when student visits page ──────────────────────
  const { data: activeSubs } = await supabase
    .from('subject_subscriptions')
    .select('id, subject_id, end_date, subjects(name)')
    .eq('user_id', profile.id)
    .in('status', ['active', 'expired'])

  if (activeSubs && activeSubs.length > 0) {
    for (const sub of activeSubs) {
      const daysLeft = Math.ceil(
        (new Date(sub.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const subjectName = (sub.subjects as { name: string } | null)?.name ?? 'Subject'

      // Expiry warnings: 7, 3, 1 days — only if still active
      if (daysLeft > 0) {
        for (const days of [7, 3, 1]) {
          if (daysLeft <= days) {
            const source = `sub_expiry_${sub.subject_id}_${days}d_${profile.id}`
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('notification_source', source)
              .maybeSingle()

            if (!existing) {
              const priority =
                days === 1 ? 'critical' : days === 3 ? 'important' : 'normal'
              await supabase.from('notifications').insert({
                title: `Subscription Expiring in ${days} Day${days > 1 ? 's' : ''}`,
                message: `Your access to ${subjectName} expires in ${days} day${days > 1 ? 's' : ''}. Contact support to renew.`,
                notification_source: source,
                target_type: 'user',
                priority,
                user_id: profile.id,
              })
              // NOT marking as read — student should see it as NEW
            }
          }
        }
      }

      // Expired: mark subscription + send notification
      if (daysLeft <= 0) {
        const source = `sub_expired_${sub.subject_id}_${profile.id}`
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('notification_source', source)
          .maybeSingle()

        if (!existing) {
          await supabase.from('notifications').insert({
            title: `Subscription Expired — ${subjectName}`,
            message: `Your subscription to ${subjectName} has expired. Please contact support to renew your access.`,
            notification_source: source,
            target_type: 'user',
            priority: 'critical',
            user_id: profile.id,
          })
          await supabase
            .from('subject_subscriptions')
            .update({ status: 'expired' })
            .eq('id', sub.id)
        }
      }
    }
  }

  // ── Fetch notifications for this user ─────────────────────────────────────
  const universityId = profile.default_university_id

  let orFilter = `target_type.eq.all`
  orFilter += `,and(target_type.eq.user,user_id.eq.${profile.id})`
  if (universityId) {
    orFilter += `,and(target_type.eq.university,university_id.eq.${universityId})`
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, notification_reads(id, user_id)')
    .is('archived_at', null)
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter(n => {
    const reads = n.notification_reads as { user_id: string }[] ?? []
    return !reads.some(r => r.user_id === profile.id)
  }).length ?? 0

  function formatDate(dateStr: string | null) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const TARGET_LABELS: Record<string, string> = {
    all: 'Platform',
    university: 'University',
    subject: 'Subject',
    user: 'Personal',
  }

  const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    normal:    { color: 'var(--primary)', bg: 'rgba(47,107,255,0.1)',  label: 'Normal'    },
    important: { color: 'var(--warn)',    bg: 'rgba(216,154,6,0.12)', label: 'Important' },
    critical:  { color: 'var(--danger)',  bg: 'rgba(220,72,66,0.1)',  label: 'Critical'  },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ padding: '28px 28px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em' }}>
            Notifications
          </h1>
          <div style={{ color: 'var(--ink-2)', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            {notifications?.length ?? 0} notifications
            {unreadCount > 0 && (
              <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(47,107,255,0.12)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* Empty state */}
        {(!notifications || notifications.length === 0) && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: '64px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(216,154,6,0.13)', color: 'var(--warn)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>No notifications yet</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', maxWidth: 360 }}>
              You'll be notified of important updates, new lectures and subscription reminders right here.
            </div>
          </div>
        )}

        {/* Notification list */}
        {notifications && notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(notif => {
              const reads = notif.notification_reads as { user_id: string }[] ?? []
              const isRead = reads.some(r => r.user_id === profile.id)
              const cfg = priorityConfig[notif.priority] ?? priorityConfig.normal

              return (
                <form
                  key={notif.id}
                  action={async () => {
                    'use server'
                    await markAsRead(notif.id, profile.id)
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'var(--card)',
                      border: '1px solid var(--line)',
                      borderLeft: !isRead ? `4px solid ${cfg.color}` : '1px solid var(--line)',
                      borderRadius: 16,
                      boxShadow: 'var(--shadow)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      cursor: isRead ? 'default' : 'pointer',
                    }}
                  >
                    {/* Icon */}
                    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg, color: cfg.color }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                      </svg>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{notif.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {cfg.label}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--bg-2)', color: 'var(--ink-3)', fontSize: 10, fontWeight: 600 }}>
                          {TARGET_LABELS[notif.target_type] ?? notif.target_type}
                        </span>
                        {!isRead && (
                          <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(47,107,255,0.12)', color: 'var(--primary)', fontSize: 10, fontWeight: 700 }}>
                            NEW
                          </span>
                        )}
                      </div>
                      {/* Message */}
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                        {notif.message}
                      </p>
                      {/* Date */}
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)' }}>
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                  </button>
                </form>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}