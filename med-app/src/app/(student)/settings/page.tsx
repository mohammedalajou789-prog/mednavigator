import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const profile = await requireAuth()
  const supabase = await createServerClient()

  const { data: device } = await supabase
    .from('devices')
    .select('id, device_name, is_active, last_login_at')
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 28px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em' }}>Settings</h1>
          <div style={{ color: 'var(--ink-2)', fontSize: 14.5 }}>Manage your account preferences</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Account Information */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--line)' }}>Account Information</div>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Full Name</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{profile.full_name ?? '—'}</div>
            </div>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{profile.email ?? '—'}</div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>Account Status</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: 'rgba(19,138,90,0.13)', color: 'var(--success)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                Active
              </span>
            </div>
          </div>

          {/* Appearance */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Appearance</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 16 }}>Theme</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Light', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>, active: true },
                { label: 'Dark',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>, active: false },
                { label: 'System', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, active: false },
              ].map(item => (
                <div key={item.label} style={{ border: `1.5px solid ${item.active ? 'var(--primary)' : 'var(--line)'}`, borderRadius: 13, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', background: 'var(--card-2)' }}>
                  {item.icon}
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 12 }}>Use the sun icon in the top bar to switch themes.</div>
          </div>

          {/* Device */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Device</div>
            {device ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>{device.device_name ?? 'Current Device'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
                    Last login: {device.last_login_at ? new Date(device.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: 'rgba(19,138,90,0.13)', color: 'var(--success)' }}>Active</span>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>No active device registered.</div>
            )}
            <div style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, marginTop: 12 }}>To reset your device, contact support via WhatsApp.</div>
          </div>

          {/* Legal */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--line)' }}>Legal</div>
            {['Terms of Service', 'Privacy Policy', 'Intellectual Property Agreement'].map((item, i, arr) => (
              <div key={item} style={{ padding: '16px 22px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View</span>
              </div>
            ))}
          </div>

          {/* Danger Zone */}
          <div style={{ background: 'var(--card)', border: '1px solid color-mix(in srgb,var(--danger) 35%,var(--line))', borderRadius: 18, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', fontSize: 16, fontWeight: 700, color: 'var(--danger)', borderBottom: '1px solid var(--line)' }}>Danger Zone</div>
            <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Sign out</span>
              <a href="/api/auth/logout" style={{ height: 38, padding: '0 18px', border: 'none', borderRadius: 10, background: 'var(--danger)', color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                Logout
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}