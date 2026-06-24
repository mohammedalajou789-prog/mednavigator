import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, default_university_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  // ── Auto-generate subscription expiry notifications ──
  const { data: activeSubs } = await supabase
    .from('subject_subscriptions')
    .select('id, subject_id, end_date, subjects(name)')
    .eq('user_id', profile.id)
    .eq('status', 'active')

  if (activeSubs) {
    for (const sub of activeSubs) {
      const endDate = new Date(sub.end_date)
      const now = new Date()
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const subjectName = (sub.subjects as any)?.name ?? 'Subject'

      const thresholds = [7, 3, 1]
      for (const days of thresholds) {
        if (daysLeft === days) {
          const source = `sub_expiry_${sub.id}_${days}d`
          // Check if already sent
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('notification_source', source)
            .maybeSingle()

          if (!existing) {
            const { data: notif } = await supabase
              .from('notifications')
              .insert({
                title: `Subscription expiring in ${days} day${days > 1 ? 's' : ''}`,
                message: `Your subscription to ${subjectName} expires in ${days} day${days > 1 ? 's' : ''}. Renew to keep access.`,
                notification_source: source,
                target_type: 'user',
                priority: days === 1 ? 'critical' : days === 3 ? 'important' : 'normal',
                user_id: profile.id,
              })
              .select('id')
              .single()

            if (notif) {
              await supabase.from('notification_reads').insert({
                notification_id: notif.id,
                user_id: profile.id,
              }).then(() => {})
            }
          }
        }
      }

      // Expired notification
      if (daysLeft <= 0) {
        const source = `sub_expired_${sub.id}`
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('notification_source', source)
          .maybeSingle()

        if (!existing) {
          await supabase.from('notifications').insert({
            title: 'Subscription expired',
            message: `Your subscription to ${subjectName} has expired. Contact support to renew.`,
            notification_source: source,
            target_type: 'user',
            priority: 'critical',
            user_id: profile.id,
          })
          // Update subscription status
          await supabase
            .from('subject_subscriptions')
            .update({ status: 'expired' })
            .eq('id', sub.id)
        }
      }
    }
  }

  // ── Fetch all relevant notifications ──
  const universityId = profile.default_university_id

  let query = supabase
    .from('notifications')
    .select('*, notification_reads(id, user_id)')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Build OR filter for all target types
  let orFilter = `target_type.eq.all`
  orFilter += `,and(target_type.eq.user,user_id.eq.${profile.id})`
  if (universityId) {
    orFilter += `,and(target_type.eq.university,university_id.eq.${universityId})`
  }

  const { data: notifications } = await query.or(orFilter)

  // Count unread
  const unreadCount = notifications?.filter(n => {
    const reads = n.notification_reads as any[] ?? []
    return !reads.some((r: any) => r.user_id === profile.id)
  }).length ?? 0

  const PRIORITY_CONFIG: Record<string, { bg: string; border: string; icon: string; badge: string; badgeText: string }> = {
    normal: {
      bg: '#fff',
      border: '#E2E8F0',
      icon: '🔔',
      badge: '#EFF6FF',
      badgeText: '#2563EB',
    },
    important: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      icon: '⚠️',
      badge: '#FEF3C7',
      badgeText: '#D97706',
    },
    critical: {
      bg: '#FEF2F2',
      border: '#FECACA',
      icon: '🚨',
      badge: '#FEE2E2',
      badgeText: '#DC2626',
    },
  }

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

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100%', padding: '28px 32px 80px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>
            {notifications?.length ?? 0} notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '20px', background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 700 }}>
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {(!notifications || notifications.length === 0) && (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '64px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <p style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>No notifications yet</p>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>You will be notified of important updates here.</p>
        </div>
      )}

      {/* Notifications list */}
      {notifications && notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '720px' }}>
          {notifications.map(notif => {
            const reads = notif.notification_reads as any[] ?? []
            const isRead = reads.some((r: any) => r.user_id === profile.id)
            const cfg = PRIORITY_CONFIG[notif.priority] ?? PRIORITY_CONFIG.normal

            return (
              <div
                key={notif.id}
                style={{
                  background: isRead ? '#fff' : cfg.bg,
                  borderRadius: '16px',
                  border: `1px solid ${isRead ? '#E2E8F0' : cfg.border}`,
                  borderLeft: !isRead ? `4px solid ${cfg.badgeText}` : `1px solid ${isRead ? '#E2E8F0' : cfg.border}`,
                  padding: '16px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                {/* Icon */}
                <div style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{notif.title}</p>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: cfg.badge, color: cfg.badgeText, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {notif.priority}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#64748B', fontSize: '10px', fontWeight: 600 }}>
                      {TARGET_LABELS[notif.target_type] ?? notif.target_type}
                    </span>
                    {!isRead && (
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB', fontSize: '10px', fontWeight: 700 }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>{notif.message}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{formatDate(notif.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}