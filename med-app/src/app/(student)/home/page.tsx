import { requireAuth } from '@/lib/services/user'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── Types ──────────────────────────────────────────────────────────────────

interface Subject {
  id: string
  name: string
  subject_type: string
  access_mode: string
  university_id: string
  slug: string | null
  description?: string | null
}

interface Subscription {
  id: string
  subject_id: string
  status: string
  end_date: string
  subject: Subject
}

interface ContinueLearning {
  lecture_id: string
  stars: number
  updated_at: string
  lecture: {
    id: string
    title: string
    subject_id: string | null
    slug: string | null
    subjects: { id: string; slug: string | null } | null
  } | null
}

interface PinnedSubject {
  subject_id: string
  subject: Subject & {
    university: { id: string; name: string; slug?: string }
  }
}

interface Notification {
  id: string
  title: string
  message: string
  priority: string
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getDaysRemaining(endDate: string): number {
  const end  = new Date(endDate)
  const now  = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function formatTimeAgo(dateStr: string): string {
  const date     = new Date(dateStr)
  const now      = new Date()
  const diffMs   = now.getTime() - date.getTime()
  const diffHrs  = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHrs < 1)    return 'Just now'
  if (diffHrs < 24)   return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).toUpperCase()
}

function getStarLabel(stars: number): { label: string; bg: string; color: string } {
  if (stars >= 3) return { label: 'Mastered',     bg: 'rgba(22,163,74,0.11)',  color: '#16A34A' }
  if (stars === 2) return { label: 'Almost There', bg: 'rgba(217,119,6,0.11)', color: '#D97706' }
  if (stars === 1) return { label: 'Need Review',  bg: 'rgba(239,68,68,0.11)', color: '#EF4444' }
  return { label: 'Not started', bg: '#F1F5F9', color: '#94A3B8' }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const profile  = await requireAuth()
  const userId   = profile.id

  const [
    { data: checklistData },
    { data: subscriptions },
    { data: pinnedSubjects },
    { data: notifications },
    { data: university },
  ] = await Promise.all([
    supabase
      .from('checklist_progress')
      .select(`stars, updated_at, lecture:lectures(id, title, subject_id, slug, subjects(id, slug))`)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('subscriptions')
      .select(`id, subject_id, status, end_date, subject:subjects(id, name, subject_type, access_mode, university_id, slug)`)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('end_date', { ascending: true }),
    supabase
      .from('pinned_subjects')
      .select(`subject_id, subject:subjects(id, name, subject_type, access_mode, university_id, slug, description, university:universities(id, name, slug))`)
      .eq('user_id', userId),
    supabase
      .from('notifications')
      .select('id, title, message, priority, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('universities')
      .select('id, name, slug, logo_url')
      .eq('id', profile.default_university_id ?? '')
      .single(),
  ])

  const checklist      = (checklistData ?? []) as unknown as ContinueLearning[]
  const subs           = (subscriptions ?? []) as unknown as Subscription[]
  const pinned         = (pinnedSubjects ?? []) as unknown as PinnedSubject[]
  const notifs         = (notifications ?? []) as unknown as Notification[]

  const continueLearning = checklist[0] ?? null
  const activeCount      = subs.length
  const bookmarkCount    = 0
  const notifCount       = notifs.length
  const masteredCount    = checklist.filter(c => c.stars >= 3).length
  const overallPct       = checklist.length > 0
    ? Math.round((checklist.reduce((s, c) => s + c.stars, 0) / (checklist.length * 3)) * 100)
    : 0

  const todayLabel = getTodayLabel()

  const sub     = subs[0] ?? null
  const subDays = sub ? getDaysRemaining(sub.end_date) : 0
  const subPct  = sub ? Math.min(100, Math.round((subDays / 90) * 100)) : 0
  const subExp  = sub ? new Date(sub.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  const pinnedSubject = pinned[0] ?? null
  const ps            = pinnedSubject?.subject as any
  const pinnedPct     = 16
  const pinnedRing    = 2 * Math.PI * 30
  const pinnedOffset  = pinnedRing * (1 - pinnedPct / 100)

  const uniSlug = (university as any)?.slug ?? (university as any)?.id ?? ''

  const clLecture = continueLearning?.lecture as any
  const clSubSlug = clLecture?.subjects?.slug ?? ''
  const clLecSlug = clLecture?.slug ?? clLecture?.id ?? ''
  const clHref    = clLecSlug ? `/${uniSlug}/${clSubSlug}/${clLecSlug}` : '#'
  const clStars   = continueLearning?.stars ?? 0
  const { label: clLabel, bg: clBg, color: clColor } = getStarLabel(clStars)

  return (
    <div style={{ background: '#F8FAFC', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`
        *,*::before,*::after { box-sizing:border-box; }
        a { text-decoration:none; color:inherit; }
        a:hover { color:#2563EB; }
        .thin-scroll::-webkit-scrollbar { width:6px; }
        .thin-scroll::-webkit-scrollbar-track { background:transparent; }
        .thin-scroll::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bellSwing {
          0%,100% { transform:rotate(0); }
          20% { transform:rotate(-14deg); }
          40% { transform:rotate(11deg); }
          60% { transform:rotate(-7deg); }
          80% { transform:rotate(4deg); }
        }
        .kpi-card { transition: transform .2s ease; }
        .kpi-card:hover { transform: translateY(-3px); }
        .resume-btn { transition: transform .2s ease, box-shadow .2s ease; }
        .resume-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(37,99,235,.4); }
        .activity-row { transition: background .2s ease; }
        .activity-row:hover { background: #F8FAFC; }
        .pinned-card { transition: transform .2s ease; }
        .pinned-card:hover { transform: translateY(-3px); }
        @media (min-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(4, minmax(0,1fr)) !important; }
          .main-grid { grid-template-columns: 1fr 320px !important; }
        }
      `}</style>

      <div style={{ padding: 'clamp(20px, 4vw, 36px)', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, animation: 'fadeUp .5s ease backwards' }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.09em', color: '#2563EB', marginBottom: 6 }}>{todayLabel}</div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.025em', color: '#0F172A', lineHeight: 1.1 }}>
              Welcome back, {profile.full_name?.split(' ')[0] ?? 'Student'}
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>
              {(university as any)?.name ?? 'Your University'} · Let&apos;s keep the streak going.
            </p>
          </div>
          {uniSlug && (
            <Link href={`/${uniSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13.5, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
              Browse subjects
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          )}
        </div>

        {/* ── KPI Grid ── */}
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>

          {/* Active Subjects */}
          <div className="kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', animation: 'fadeUp .5s ease .05s backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(37,99,235,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', color: '#16A34A' }}>SUBSCRIBED</span>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: '#0F172A' }}>{activeCount}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>Active subjects</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', animation: 'fadeUp .5s ease .1s backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(22,163,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', color: '#16A34A' }}>ON TRACK</span>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: '#0F172A' }}>{overallPct}%</div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>Overall progress · {masteredCount} mastered</div>
            </div>
          </div>

          {/* Bookmarks */}
          <div className="kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', animation: 'fadeUp .5s ease .15s backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', color: '#7C3AED' }}>SAVED</span>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: '#0F172A' }}>{bookmarkCount}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>Bookmarks</div>
            </div>
          </div>

          {/* Notifications */}
          <div className="kpi-card" style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', animation: 'fadeUp .5s ease .2s backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(217,119,6,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', color: '#94A3B8' }}>ALL READ</span>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: '#0F172A' }}>{notifCount}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>Notifications</div>
            </div>
          </div>

        </div>

        {/* ── Continue Learning ── */}
        {continueLearning && clLecture && (
          <div style={{ background: 'linear-gradient(120deg, rgba(37,99,235,0.06), #fff 60%)', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', animation: 'fadeUp .5s ease .25s backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', flexWrap: 'wrap' }}>
              <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 13, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(37,99,235,0.35)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="7 4 20 12 7 20 7 4"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#2563EB', marginBottom: 2 }}>CONTINUE LEARNING</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clLecture.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Pick up where you left off</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[['#EF4444'], ['#F59E0B'], ['#22C55E']].map(([c], i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < clStars ? c : '#E2E8F0'} stroke={i < clStars ? c : '#E2E8F0'} strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 3 }}>{clLabel}</div>
              </div>
              <Link href={clHref} className="resume-btn" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', borderRadius: 11, background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                Resume →
              </Link>
            </div>
            <div style={{ height: 4, background: 'rgba(37,99,235,0.12)' }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: '#2563EB' }} />
            </div>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22, alignItems: 'stretch' }}>

          {/* Recent Activity */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 520, animation: 'fadeUp .5s ease .3s backwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Recent activity</div>
              <Link href="/progress" style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>View all</Link>
            </div>
            <div className="thin-scroll" style={{ overflowY: 'auto' }}>
              {checklist.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5 }}>No activity yet.</div>
              ) : checklist.map((row, i) => {
                const lec = row.lecture as any
                const { label, bg, color } = getStarLabel(row.stars)
                return (
                  <div key={i} className="activity-row" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.08)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lec?.title ?? 'Lecture'}</div>
                      <div style={{ fontSize: 12.5, color: '#94A3B8' }}>{formatTimeAgo(row.updated_at)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: bg, color }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Active Subscription */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', animation: 'fadeUp .5s ease .35s backwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Active subscription</div>
                <Link href="/subscriptions" style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>View all</Link>
              </div>
              {!sub ? (
                <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>No active subscriptions.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,163,74,0.12)' }}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>{sub.subject?.name ?? 'Subject'}</div>
                      <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Expires {subExp}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, height: 7, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${subPct}%`, borderRadius: 99, background: '#2563EB' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Subscription</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: subDays <= 7 ? '#D97706' : '#2563EB' }}>{subDays} days left</span>
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', flex: 1, display: 'flex', flexDirection: 'column', animation: 'fadeUp .5s ease .4s backwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Notifications</div>
                <Link href="/notifications" style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>View all</Link>
              </div>
              {notifs.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '18px 0', gap: 8, color: '#94A3B8' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bellSwing 2.2s ease-in-out infinite', transformOrigin: '50% 0%' }}>
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                  </svg>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#64748B' }}>You&apos;re all caught up</div>
                  <div style={{ fontSize: 12.5 }}>No new notifications.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifs.map(n => (
                    <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.priority === 'critical' ? 'rgba(220,38,38,0.10)' : n.priority === 'important' ? 'rgba(217,119,6,0.10)' : '#F1F5F9' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={n.priority === 'critical' ? '#DC2626' : n.priority === 'important' ? '#D97706' : '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{formatTimeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Pinned Subjects ── */}
        <div style={{ animation: 'fadeUp .5s ease .45s backwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Pinned subjects</div>
            {uniSlug && <Link href={`/${uniSlug}`} style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>View all</Link>}
          </div>

          {pinned.length === 0 ? (
            <div style={{ background: '#fff', border: '1px dashed #E2E8F0', borderRadius: 18, padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.10)', color: '#2563EB' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-5.5a3 3 0 0 1 .3-2.3L20 6H4l1.2 3.2a3 3 0 0 1 .3 2.3z"/><line x1="9" y1="6" x2="9" y2="3"/><line x1="15" y1="6" x2="15" y2="3"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No pinned subjects yet</div>
              <div style={{ fontSize: 13.5, color: '#64748B', maxWidth: 340 }}>Pin a subject from its page and it will show up here for quick access.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
              {pinned.map(({ subject_id, subject }) => {
                const s        = subject as any
                const uSlug    = s?.university?.slug ?? s?.university_id ?? ''
                const sSlug    = s?.slug ?? subject_id
                const href     = `/${uSlug}/${sSlug}`
                return (
                  <Link key={subject_id} href={href} className="pinned-card" style={{ position: 'relative', background: 'linear-gradient(135deg, #EFF4FF, #F5F1FF)', border: '1px solid #E2E8F0', borderRadius: 18, overflow: 'hidden', display: 'block', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
                    <div style={{ padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: 'rgba(22,163,74,0.10)', color: '#16A34A' }}>
                            {s?.subject_type === 'clinical' ? 'Clinical' : s?.subject_type === 'system' ? 'System' : 'Standard'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: 'rgba(217,119,6,0.10)', color: '#D97706' }}>
                            {s?.access_mode === 'free' ? 'Free' : s?.access_mode === 'premium' ? 'Premium' : 'Mixed'}
                          </span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{s?.name}</div>
                        {s?.description && (
                          <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, maxWidth: 520, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.description}</div>
                        )}
                      </div>
                      <svg width="70" height="70" viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
                        <circle cx="35" cy="35" r="30" fill="none" stroke="#E2E8F0" strokeWidth="6"/>
                        <circle cx="35" cy="35" r="30" fill="none" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" transform="rotate(-90 35 35)" strokeDasharray={pinnedRing} strokeDashoffset={pinnedOffset}/>
                        <text x="35" y="33" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0F172A">{pinnedPct}%</text>
                        <text x="35" y="46" textAnchor="middle" fontSize="8" fill="#94A3B8">Progress</text>
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
