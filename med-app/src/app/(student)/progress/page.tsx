import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProgressPage() {
  const supabase = await createServerClient()
  const profile  = await requireAuth()

  // ── Step 1: get active subscriptions + free subjects the user accessed ──
  const [
    { data: checklistData },
    { data: allLecturesData },
    { count: bookmarksCount },
  ] = await Promise.all([
    // All star ratings by this user
    supabase
      .from('checklist_progress')
      .select(`
        lecture_id,
        stars,
        updated_at,
        lectures (
          id,
          title,
          subject_id,
          subjects (
            id,
            name,
            university_id,
            universities ( id, name, slug )
          )
        )
      `)
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false }),

    // All published lectures from subjects the user has interacted with
    // (has at least one checklist entry)
    supabase
      .from('checklist_progress')
      .select('lecture_id, lectures!inner(subject_id)')
      .eq('user_id', profile.id),

    supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ])

  // ── Step 2: collect subject IDs from checklist ─────────────────────────
  const subjectIdsSet = new Set<string>()
  checklistData?.forEach(row => {
    const lecture = row.lectures as any
    if (lecture?.subject_id) subjectIdsSet.add(lecture.subject_id)
  })
  const subjectIds = Array.from(subjectIdsSet)

  // ── Step 3: fetch ALL lectures for those subjects ──────────────────────
  let totalLecturesBySubject: Record<string, number> = {}

  if (subjectIds.length > 0) {
    const { data: lecturesInSubjects } = await supabase
      .from('lectures')
      .select('id, subject_id')
      .in('subject_id', subjectIds)
      .eq('status', 'published')

    lecturesInSubjects?.forEach((l: any) => {
      totalLecturesBySubject[l.subject_id] = (totalLecturesBySubject[l.subject_id] ?? 0) + 1
    })
  }

  // ── Step 4: build star map ─────────────────────────────────────────────
  const starsByLecture: Record<string, number> = {}
  checklistData?.forEach(row => {
    if (row.lecture_id) starsByLecture[row.lecture_id] = row.stars ?? 0
  })

  // ── Step 5: build subject map ──────────────────────────────────────────
  type LectureEntry = {
    id: string
    title: string
    stars: number
    lastUpdated: string | null
  }

  const subjectMap: Record<string, {
    id: string
    name: string
    universityName: string
    universitySlug: string
    totalLectures: number
    lectures: LectureEntry[]
  }> = {}

  checklistData?.forEach(row => {
    const lecture    = row.lectures as any
    if (!lecture) return
    const subject    = lecture.subjects as any
    if (!subject) return
    const university = subject.universities as any

    if (!subjectMap[subject.id]) {
      subjectMap[subject.id] = {
        id:             subject.id,
        name:           subject.name,
        universityName: university?.name ?? '',
        universitySlug: university?.slug ?? '',
        totalLectures:  totalLecturesBySubject[subject.id] ?? 0,
        lectures:       [],
      }
    }

    const existing = subjectMap[subject.id].lectures.find(l => l.id === lecture.id)
    if (!existing) {
      subjectMap[subject.id].lectures.push({
        id:          lecture.id,
        title:       lecture.title,
        stars:       row.stars ?? 0,
        lastUpdated: row.updated_at,
      })
    }
  })

  const subjects = Object.values(subjectMap)

  // ── Step 6: KPI calculations using TOTAL lectures per subject ──────────
  const totalStarsAll    = subjects.reduce((s, sub) => s + sub.lectures.reduce((a, l) => a + l.stars, 0), 0)
  const totalLecturesAll = subjects.reduce((s, sub) => s + sub.totalLectures, 0)
  const masteredCount    = subjects.reduce((s, sub) => s + sub.lectures.filter(l => l.stars === 3).length, 0)
  const overallPercent   = totalLecturesAll > 0
    ? Math.round((totalStarsAll / (totalLecturesAll * 3)) * 100)
    : 0

  const recentActivity = (checklistData ?? []).slice(0, 10)

  function formatDate(dateStr: string | null) {
    if (!dateStr) return ''
    const d    = new Date(dateStr)
    const now  = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60)     return 'Just now'
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const STAR_LABELS: Record<number, string> = {
    0: 'Not started', 1: 'Need Review', 2: 'Almost There', 3: 'Mastered',
  }
  const STAR_COLORS: Record<number, { bg: string; color: string }> = {
    0: { bg: '#F1F5F9', color: '#94A3B8' },
    1: { bg: '#FEF2F2', color: '#EF4444' },
    2: { bg: '#FFFBEB', color: '#F59E0B' },
    3: { bg: '#F0FDF4', color: '#22C55E' },
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.025em' }}>My Progress</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--ink-2)' }}>Track your learning across all subjects</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        <KpiCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          label="Overall Progress" value={`${overallPercent}%`} sub="across all lectures" color="#2563EB" bg="#EFF6FF"
        />
        <KpiCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="Mastered" value={`${masteredCount}`} sub={`of ${totalLecturesAll} lectures`} color="#16A34A" bg="#F0FDF4"
        />
        <KpiCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
          label="Active Subjects" value={`${subjects.length}`} sub="being studied" color="#7C3AED" bg="#F5F3FF"
        />
        <KpiCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>}
          label="Bookmarks" value={`${bookmarksCount ?? 0}`} sub="saved items" color="#D97706" bg="#FFFBEB"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Subject Progress */}
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Progress by Subject</h2>

          {subjects.length === 0 ? (
            <div style={{ background: 'var(--card)', borderRadius: '18px', border: '1px solid var(--line)', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-2)', margin: '0 0 8px' }}>No progress yet</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 20px' }}>Rate lectures with stars to track your progress</p>
              <Link href="/home" prefetch={false} style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Browse Subjects</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {subjects.map(subject => {
                const subjectStars   = subject.lectures.reduce((s, l) => s + l.stars, 0)
                const subjectPercent = subject.totalLectures > 0
                  ? Math.round((subjectStars / (subject.totalLectures * 3)) * 100)
                  : 0
                const masteredInSubject = subject.lectures.filter(l => l.stars === 3).length

                return (
                  <div key={subject.id} style={{ background: 'var(--card)', borderRadius: '18px', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>{subject.name}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--ink-3)' }}>{subject.universityName}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#2563EB' }}>{subjectPercent}%</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--ink-3)' }}>{masteredInSubject}/{subject.totalLectures} mastered</p>
                      </div>
                    </div>

                    <div style={{ height: '6px', background: 'var(--bg-2)', borderRadius: '999px', marginBottom: '14px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${subjectPercent}%`, background: subjectPercent === 100 ? '#16A34A' : 'linear-gradient(90deg,#3B82F6,#2563EB)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {subject.lectures.slice(0, 5).map(lecture => {
                        const starColor = STAR_COLORS[lecture.stars]
                        return (
                          <div key={lecture.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--bg-2)' }}>
                            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                              {[1,2,3].map(i => (
                                <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                                  fill={i <= lecture.stars ? (i === 1 ? '#EF4444' : i === 2 ? '#F59E0B' : '#22C55E') : 'none'}
                                  stroke={i <= lecture.stars ? (i === 1 ? '#EF4444' : i === 2 ? '#F59E0B' : '#22C55E') : '#CBD5E1'}
                                  strokeWidth="1.5">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              ))}
                            </div>
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lecture.title}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: starColor.bg, color: starColor.color, flexShrink: 0 }}>
                              {STAR_LABELS[lecture.stars]}
                            </span>
                          </div>
                        )
                      })}
                      {subject.totalLectures > 5 && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ink-3)', textAlign: 'center' }}>
                          +{subject.totalLectures - subject.lectures.length} more lectures not yet started
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', alignItems: 'stretch' }}>

          {/* Summary */}
          <div style={{ background: 'var(--card)', borderRadius: '18px', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow)' }}>
            <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Summary</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SummaryRow label="Overall Progress" value={`${overallPercent}%`} color="#2563EB" percent={overallPercent} />
              <SummaryRow label="Mastered" value={`${masteredCount}/${totalLecturesAll}`} color="#16A34A" percent={totalLecturesAll > 0 ? Math.round((masteredCount / totalLecturesAll) * 100) : 0} />
              <SummaryRow label="Subjects" value={`${subjects.length}`} color="#7C3AED" percent={100} />
              <SummaryRow label="Bookmarks" value={`${bookmarksCount ?? 0}`} color="#D97706" percent={100} />
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'var(--card)', borderRadius: '18px', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow)' }}>
            <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Activity</p>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', textAlign: 'center', padding: '16px 0' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentActivity.map((row, i) => {
                  const lecture   = (row as any).lectures as any
                  const starColor = STAR_COLORS[row.stars ?? 0]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: starColor.bg, color: starColor.color, flexShrink: 0 }}>
                        {STAR_LABELS[row.stars ?? 0]}
                      </span>
                      <span style={{ flex: 1, fontSize: '12px', color: 'var(--ink-2)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lecture?.title ?? 'Lecture'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-3)', flexShrink: 0 }}>
                        {formatDate(row.updated_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string
}) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: '18px', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>{icon}</div>
      <p style={{ margin: '0 0 2px', fontSize: '26px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: 'var(--ink-2)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-3)' }}>{sub}</p>
    </div>
  )
}

function SummaryRow({ label, value, color, percent }: { label: string; value: string; color: string; percent: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-2)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: '5px', background: 'var(--bg-2)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}