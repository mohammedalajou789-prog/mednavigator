import { requireAuth } from '@/lib/services/user'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────

interface University {
  id: string
  name: string
  logo_url: string | null
  slug: string | null
}

interface Subject {
  id: string
  name: string
  subject_type: string
  access_mode: string
  university_id: string
  slug: string | null
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
    subjects: {
      id: string
      slug: string | null
    } | null
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
  const date    = new Date(dateStr)
  const now     = new Date()
  const diffMs  = now.getTime() - date.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHrs < 1)   return 'Just now'
  if (diffHrs < 24)  return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function getTypeLabel(type: string) {
  if (type === 'standard') return 'Standard'
  if (type === 'system')   return 'System'
  if (type === 'clinical') return 'Clinical'
  return type
}

function getAccessLabel(mode: string) {
  if (mode === 'free')    return 'Free'
  if (mode === 'premium') return 'Premium'
  if (mode === 'mixed')   return 'Mixed'
  return mode
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).toUpperCase()
}

// ── Design tokens ──────────────────────────────────────────────────────────
const PRIMARY  = '#2563EB'
const SUCCESS  = '#16A34A'
const AMBER    = '#D97706'
const PURPLE   = '#7C3AED'
const CARD_BG  = '#FFFFFF'
const CARD_BDR = '#E2E8F0'
const INK      = '#0F172A'
const INK2     = '#64748B'
const INK3     = '#94A3B8'

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ iconBg, icon, badge, badgeColor, value, sub }: {
  iconBg: string; icon: React.ReactNode; badge: string
  badgeColor: string; value: string | number; sub: string
}) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${CARD_BDR}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '.07em', color: badgeColor }}>{badge}</span>
      </div>
      <div>
        <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: INK, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ marginTop: '6px', fontSize: '13px', color: INK2 }}>{sub}</div>
      </div>
    </div>
  )
}

// ── Type / Access badges ───────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    standard: { bg: 'rgba(37,99,235,0.10)',  color: PRIMARY },
    system:   { bg: 'rgba(124,58,237,0.10)', color: PURPLE },
    clinical: { bg: 'rgba(22,163,74,0.10)',  color: SUCCESS },
  }
  const s = map[type] ?? { bg: '#F1F5F9', color: INK2 }
  return <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '7px', background: s.bg, color: s.color }}>{getTypeLabel(type)}</span>
}

function AccessBadge({ mode }: { mode: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    free:    { bg: 'rgba(22,163,74,0.10)',  color: SUCCESS },
    premium: { bg: 'rgba(217,119,6,0.12)',  color: AMBER },
    mixed:   { bg: '#F1F5F9',               color: INK2 },
  }
  const s = map[mode] ?? { bg: '#F1F5F9', color: INK2 }
  return <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '7px', background: s.bg, color: s.color }}>{getAccessLabel(mode)}</span>
}

// ── Content type icon ──────────────────────────────────────────────────────

function ContentIcon({ type, color, bg }: { type: string; color: string; bg: string }) {
  const icons: Record<string, React.ReactNode> = {
    sheet: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>,
    flashcards: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    quiz: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    previous_years: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    summary: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  }
  return (
    <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
      {icons[type] ?? icons.sheet}
    </div>
  )
}

// ── Star icon ──────────────────────────────────────────────────────────────

function StarLabel({ stars }: { stars: number }) {
  const labels: Record<number, string> = { 0: 'Not started', 1: 'Need Review', 2: 'Almost There', 3: 'Mastered' }
  const colors: Record<number, { bg: string; color: string }> = {
    0: { bg: '#F1F5F9', color: '#94A3B8' },
    1: { bg: '#FEF2F2', color: '#EF4444' },
    2: { bg: '#FFFBEB', color: '#F59E0B' },
    3: { bg: '#F0FDF4', color: '#22C55E' },
  }
  const c = colors[stars] ?? colors[0]
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: c.bg, color: c.color }}>
      {labels[stars]}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function StudentDashboard() {
  const profile  = await requireAuth()
  const supabase = await createClient()

  const [
    uniResult,
    pinnedResult,
    subsResult,
    checklistResult,
    bookmarkResult,
    notifResult,
    activeSubsResult,
  ] = await Promise.all([
    profile.default_university_id
      ? supabase.from('universities').select('id, name, logo_url, slug').eq('id', profile.default_university_id).single()
      : Promise.resolve({ data: null }),

    supabase.from('pinned_subjects').select(`
      subject_id,
      subject:subjects ( id, name, subject_type, access_mode, university_id, slug,
        university:universities ( id, name, slug )
      )
    `).eq('user_id', profile.id).limit(6),

    supabase.from('subject_subscriptions').select(`
      id, subject_id, status, end_date,
      subject:subjects ( id, name, subject_type, access_mode, university_id )
    `).eq('user_id', profile.id).eq('status', 'active').order('end_date', { ascending: true }).limit(5),

    // ── NEW: read from checklist_progress instead of user_progress ──
    supabase.from('checklist_progress').select(`
      lecture_id, stars, updated_at,
      lecture:lectures (
        id, title, subject_id, slug,
        subjects ( id, slug )
      )
    `).eq('user_id', profile.id).order('updated_at', { ascending: false }).limit(10),

    supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),

    supabase.from('notifications').select('id, title, message, priority, created_at')
      .or(`target_type.eq.all,and(target_type.eq.user,user_id.eq.${profile.id})`)
      .order('created_at', { ascending: false }).limit(5),

    supabase.from('subject_subscriptions').select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id).eq('status', 'active'),
  ])

  const { data: readIds } = await supabase
    .from('notification_reads').select('notification_id').eq('user_id', profile.id)

  const readSet        = new Set((readIds ?? []).map((r: { notification_id: string }) => r.notification_id))
  const notifications  = (notifResult.data ?? []) as Notification[]
  const unreadCount    = notifications.filter(n => !readSet.has(n.id)).length
  const university     = uniResult.data as University | null
  const pinnedSubjects = (pinnedResult.data ?? []) as unknown as PinnedSubject[]
  const subscriptions  = (subsResult.data ?? []) as unknown as Subscription[]
  const checklistData  = (checklistResult.data ?? []) as unknown as ContinueLearning[]
  const bookmarkCount  = bookmarkResult.count ?? 0
  const activeSubjectCount = activeSubsResult.count ?? 0

  // Accurate progress: count ALL lectures in subscribed subjects, not just touched ones
  const subjectIds = (subsResult.data ?? []).map((s: any) => s.subject_id).filter(Boolean)
  let totalLectureCount = Math.max(checklistData.length, 1)
  if (subjectIds.length > 0) {
    const { count: lecCount } = await supabase
      .from('lectures')
      .select('id', { count: 'exact', head: true })
      .in('subject_id', subjectIds)
    totalLectureCount = Math.max(lecCount ?? 0, checklistData.length, 1)
  }

  // ── Continue Learning: last accessed lecture ────────────────────────────
  const lastChecklist = checklistData[0] ?? null

  // ── Overall progress from checklist ────────────────────────────────────
  const totalStars    = checklistData.reduce((s, r) => s + (r.stars ?? 0), 0)
  const overallPercent = totalLectureCount > 0
    ? Math.round((totalStars / (totalLectureCount * 3)) * 100)
    : 0

  const masteredCount = checklistData.filter(r => r.stars === 3).length

  const firstName = profile.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Welcome header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: PRIMARY, marginBottom: '6px' }}>
            {getTodayLabel()}
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, letterSpacing: '-.025em', color: INK, lineHeight: 1.1 }}>
            Welcome back, {firstName}
          </h1>
          <div style={{ fontSize: '14.5px', color: INK2, marginTop: '4px' }}>
            {university?.name ?? 'No university selected'} · Let&apos;s keep the streak going.
          </div>
        </div>
        {university && (
          <Link href={`/${university.slug ?? university.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 18px', borderRadius: '11px', border: `1px solid ${CARD_BDR}`, background: CARD_BG, color: INK, fontSize: '14px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 1px 2px rgba(15,23,42,.06)', whiteSpace: 'nowrap' }}>
            Browse subjects
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', marginBottom: '22px' }}>
        <KpiCard
          iconBg="rgba(37,99,235,0.12)" badge="SUBSCRIBED" badgeColor={INK3}
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
          value={activeSubjectCount} sub="Active subjects"
        />
        <KpiCard
          iconBg="rgba(22,163,74,0.12)" badge="ON TRACK" badgeColor={SUCCESS}
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={SUCCESS} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          value={`${overallPercent}%`} sub={`Overall progress · ${masteredCount} mastered`}
        />
        <KpiCard
          iconBg="rgba(124,58,237,0.12)" badge="SAVED" badgeColor={INK3}
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
          value={bookmarkCount} sub="Bookmarks"
        />
        <KpiCard
          iconBg="rgba(217,119,6,0.12)" badge="ALL READ" badgeColor={INK3}
          icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>}
          value={unreadCount} sub="Notifications"
        />
      </div>

      {/* ── Continue Learning ── */}
      {lastChecklist && lastChecklist.lecture && (
        <div style={{ background: `linear-gradient(120deg,rgba(37,99,235,0.06),${CARD_BG} 60%)`, border: `1px solid ${CARD_BDR}`, borderRadius: '18px', overflow: 'hidden', marginBottom: '22px', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '22px 24px' }}>
            <div style={{ width: '54px', height: '54px', flexShrink: 0, borderRadius: '15px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(37,99,235,.35)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="7 4 20 12 7 20 7 4"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', color: PRIMARY, marginBottom: '3px' }}>
                CONTINUE LEARNING
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-.01em', color: INK }}>
                {lastChecklist.lecture.title}
              </div>
              <div style={{ fontSize: '13px', color: INK2, marginTop: '2px' }}>
                Last reviewed {formatTimeAgo(lastChecklist.updated_at)}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3].map(i => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24"
                    fill={i <= lastChecklist.stars ? (i === 1 ? '#EF4444' : i === 2 ? '#F59E0B' : '#22C55E') : 'none'}
                    stroke={i <= lastChecklist.stars ? (i === 1 ? '#EF4444' : i === 2 ? '#F59E0B' : '#22C55E') : '#CBD5E1'}
                    strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <div style={{ fontSize: '11.5px', color: INK3, fontWeight: 600, marginTop: 4 }}>
                {lastChecklist.stars === 3 ? 'Mastered' : lastChecklist.stars === 2 ? 'Almost There' : lastChecklist.stars === 1 ? 'Need Review' : 'Not started'}
              </div>
            </div>
            {(() => {
              const lec     = lastChecklist.lecture as any
              const subject = lec?.subjects
              const subSlug = subject?.slug ?? lec?.subject_id ?? ''
              const lecSlug = lec?.slug ?? lec?.id ?? ''
              const uniSlug = university?.slug ?? university?.id ?? ''
              const href    = subSlug && lecSlug ? `/${uniSlug}/${subSlug}/${lecSlug}` : '#'
              return (
                <Link href={href}
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 20px', border: 'none', borderRadius: '12px', background: PRIMARY, color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                  Resume
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              )
            })()}
          </div>
          <div style={{ height: '5px', background: 'rgba(37,99,235,0.12)' }}>
            <div style={{ height: '100%', width: `${Math.round((lastChecklist.stars / 3) * 100)}%`, background: PRIMARY, transition: 'width .6s ease' }} />
          </div>
        </div>
      )}

      {/* ── Two column: Recent Activity + Right Rail ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '22px', marginBottom: '22px' }}>

        {/* Recent Activity */}
        <div style={{ background: CARD_BG, border: `1px solid ${CARD_BDR}`, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-.01em', color: INK }}>Recent activity</div>
            <Link href="/progress" style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, textDecoration: 'none' }}>View all</Link>
          </div>
          {checklistData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: INK3, fontSize: '13.5px' }}>No activity yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {checklistData.slice(0, 5).map((row, i) => {
                const lec = row.lecture as any
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 20px', borderTop: `1px solid ${CARD_BDR}` }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.08)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lec?.title ?? 'Lecture'}</div>
                      <div style={{ fontSize: '12.5px', color: INK3 }}>{formatTimeAgo(row.updated_at)}</div>
                    </div>
                    <StarLabel stars={row.stars ?? 0} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Active subscription */}
          <div style={{ background: CARD_BG, border: `1px solid ${CARD_BDR}`, borderRadius: '18px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-.01em', color: INK }}>Active subscription</div>
              <Link href="/subscriptions" style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, textDecoration: 'none' }}>View all</Link>
            </div>
            {subscriptions.length === 0 ? (
              <div style={{ fontSize: '13px', color: INK3, textAlign: 'center', padding: '16px 0' }}>No active subscriptions.</div>
            ) : (() => {
              const sub  = subscriptions[0]
              const days = getDaysRemaining(sub.end_date)
              const pct  = Math.min(100, Math.max(0, Math.round((days / 90) * 100)))
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,163,74,0.12)' }}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={SUCCESS} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: INK }}>{sub.subject?.name ?? 'Subject'}</div>
                      <div style={{ fontSize: '12.5px', color: INK3 }}>Expires {new Date(sub.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', height: '7px', borderRadius: '99px', background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: PRIMARY, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: INK3 }}>Subscription</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: days <= 7 ? AMBER : PRIMARY }}>{days} days left</span>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Notifications */}
          <div style={{ background: CARD_BG, border: `1px solid ${CARD_BDR}`, borderRadius: '18px', padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-.01em', color: INK }}>Notifications</div>
              <Link href="/notifications" style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, textDecoration: 'none' }}>View all</Link>
            </div>
            {notifications.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '18px 0', gap: '8px', color: INK3 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: INK2 }}>You&apos;re all caught up</div>
                <div style={{ fontSize: '12.5px' }}>No new notifications.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.priority === 'critical' ? 'rgba(220,38,38,0.10)' : n.priority === 'important' ? 'rgba(217,119,6,0.10)' : '#F1F5F9' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={n.priority === 'critical' ? '#DC2626' : n.priority === 'important' ? AMBER : INK2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: INK }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: INK3 }}>{formatTimeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pinned Subjects ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-.01em', color: INK }}>Pinned subjects</div>
          {university && (
            <Link href={`/${university.slug ?? university.id}`} style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, textDecoration: 'none' }}>View all</Link>
          )}
        </div>
        {pinnedSubjects.length === 0 ? (
          <div style={{ background: CARD_BG, border: `1px dashed ${CARD_BDR}`, borderRadius: '18px', padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.10)', color: PRIMARY }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-5.5a3 3 0 0 1 .3-2.3L20 6H4l1.2 3.2a3 3 0 0 1 .3 2.3z"/><line x1="9" y1="6" x2="9" y2="3"/><line x1="15" y1="6" x2="15" y2="3"/></svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: INK }}>No pinned subjects yet</div>
            <div style={{ fontSize: '13.5px', color: INK2, maxWidth: '340px' }}>Pin a subject from its page and it will show up here for quick access.</div>
            {university && (
              <Link href={`/${university.slug ?? university.id}`}
                style={{ marginTop: '6px', height: '38px', padding: '0 16px', borderRadius: '10px', border: `1px solid ${CARD_BDR}`, background: '#F1F5F9', color: INK, fontSize: '13.5px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Browse subjects
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px' }}>
            {pinnedSubjects.map(({ subject_id, subject }) => (
              <Link key={subject_id}
                href={`/${(subject.university as any)?.slug ?? subject.university_id}/${subject.slug ?? subject_id}`}
                style={{ background: CARD_BG, border: `1px solid ${CARD_BDR}`, borderRadius: '18px', overflow: 'hidden', textDecoration: 'none', display: 'block', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)' }}>
                <div style={{ height: '5px', background: `linear-gradient(90deg,${PRIMARY},${PURPLE})` }} />
                <div style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', gap: '7px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <TypeBadge type={subject.subject_type} />
                    <AccessBadge mode={subject.access_mode} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: INK, marginBottom: '4px' }}>{subject.name}</div>
                  <div style={{ fontSize: '12.5px', color: INK3 }}>{subject.university?.name ?? ''}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}