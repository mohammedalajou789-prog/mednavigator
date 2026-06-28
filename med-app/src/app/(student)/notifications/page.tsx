return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 28px 64px' }}>

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

        {/* Empty State */}
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

        {/* Notifications List */}
        {notifications && notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(notif => {
              const reads = notif.notification_reads as { user_id: string }[] ?? []
              const isRead = reads.some(r => r.user_id === profile.id)

              const priorityConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
                normal:    { color: 'var(--primary)',  bg: 'rgba(47,107,255,0.1)',  border: 'var(--primary)',  label: 'Normal'    },
                important: { color: 'var(--warn)',     bg: 'rgba(216,154,6,0.12)', border: 'var(--warn)',     label: 'Important' },
                critical:  { color: 'var(--danger)',   bg: 'rgba(220,72,66,0.1)',  border: 'var(--danger)',   label: 'Critical'  },
              }
              const cfg = priorityConfig[notif.priority] ?? priorityConfig.normal

              return (
                <div key={notif.id} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderLeft: !isRead ? `4px solid ${cfg.color}` : '1px solid var(--line)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}>
                  {/* Icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg, color: cfg.color }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                    </svg>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
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
                    <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{notif.message}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)' }}>{formatDate(notif.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}