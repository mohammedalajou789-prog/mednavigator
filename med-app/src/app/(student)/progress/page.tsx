import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProgressPage() {
  const supabase = await createServerClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, default_university_id')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!profile) redirect('/login')

 const [
    { data: progressData },
    { data: subscriptions },
    { count: bookmarksCount },
  ] = await Promise.all([
    supabase
      .from('user_progress')
      .select(`
        id,
        lecture_id,
        content_type,
        progress_percentage,
        completed,
        last_accessed_at,
        lectures (
          id,
          title,
          subject_id,
          chapter_id,
          subjects (
            id,
            name,
            university_id,
            universities ( id, name )
          )
        )
      `)
      .eq('user_id', profile.id)
      .order('last_accessed_at', { ascending: false }),
    supabase
      .from('subject_subscriptions')
      .select('subject_id, status, end_date')
      .eq('user_id', profile.id)
      .eq('status', 'active'),
    supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ])

  // Process data
  const totalLectures = progressData?.length ?? 0
  const completedLectures = progressData?.filter(p => p.completed).length ?? 0
  const totalProgress = totalLectures > 0
    ? Math.round(progressData!.reduce((sum, p) => sum + (p.progress_percentage ?? 0), 0) / totalLectures)
    : 0

  // Group by subject
  const subjectMap: Record<string, {
    id: string
    name: string
    universityName: string
    universityId: string
    lectures: { id: string; title: string; progress: number; completed: boolean; lastAccessed: string | null; contentType: string }[]
  }> = {}

  progressData?.forEach(p => {
    const lecture = p.lectures as any
    if (!lecture) return
    const subject = lecture.subjects as any
    if (!subject) return
    const university = subject.universities as any

    if (!subjectMap[subject.id]) {
      subjectMap[subject.id] = {
        id: subject.id,
        name: subject.name,
        universityName: university?.name ?? '',
        universityId: subject.university_id,
        lectures: [],
      }
    }

    // avoid duplicates per lecture
    const existing = subjectMap[subject.id].lectures.find(l => l.id === lecture.id)
    if (!existing) {
      subjectMap[subject.id].lectures.push({
        id: lecture.id,
        title: lecture.title,
        progress: p.progress_percentage ?? 0,
        completed: p.completed ?? false,
        lastAccessed: p.last_accessed_at,
        contentType: p.content_type,
      })
    }
  })

  const subjects = Object.values(subjectMap)

  // Recent activity — last 10
  const recentActivity = progressData?.slice(0, 10) ?? []

  function formatDate(dateStr: string | null) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const CONTENT_TYPE_LABELS: Record<string, string> = {
    sheet: 'Sheet', summary: 'Summary', flashcards: 'Flashcards',
    quiz: 'Quiz', previous_years: 'Previous Years',
  }

  const CONTENT_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    sheet: { bg: '#EFF6FF', color: '#2563EB' },
    summary: { bg: '#F0FDF4', color: '#16A34A' },
    flashcards: { bg: '#FDF4FF', color: '#9333EA' },
    quiz: { bg: '#FFFBEB', color: '#D97706' },
    previous_years: { bg: '#FEF2F2', color: '#DC2626' },
  }

  return (
    <div style={{ background: '#F5F6FA', minHeight: '100%', padding: '28px 32px 80px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
          My Progress
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>
          Track your learning across all subjects
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          }
          label="Overall Progress"
          value={`${totalProgress}%`}
          sub="across all lectures"
          color="#2563EB"
          bg="#EFF6FF"
        />
        <KpiCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
          label="Completed"
          value={`${completedLectures}`}
          sub={`of ${totalLectures} lectures`}
          color="#16A34A"
          bg="#F0FDF4"
        />
        <KpiCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          }
          label="Active Subjects"
          value={`${subjects.length}`}
          sub="being studied"
          color="#7C3AED"
          bg="#F5F3FF"
        />
        <KpiCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          }
          label="Bookmarks"
          value={`${bookmarksCount ?? 0}`}
          sub="saved items"
          color="#D97706"
          bg="#FFFBEB"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Subject Progress */}
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
            Progress by Subject
          </h2>

          {subjects.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>No progress yet</p>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px' }}>Start reading lectures to track your progress</p>
              <Link href="/home" style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Browse Subjects
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {subjects.map(subject => {
                const subjectProgress = subject.lectures.length > 0
                  ? Math.round(subject.lectures.reduce((s, l) => s + l.progress, 0) / subject.lectures.length)
                  : 0
                const completedInSubject = subject.lectures.filter(l => l.completed).length

                return (
                  <div key={subject.id} style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{subject.name}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>{subject.universityName}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#2563EB' }}>{subjectProgress}%</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94A3B8' }}>{completedInSubject}/{subject.lectures.length} done</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '6px', background: '#EEF0F4', borderRadius: '999px', marginBottom: '14px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${subjectProgress}%`, background: subjectProgress === 100 ? '#16A34A' : 'linear-gradient(90deg,#3B82F6,#2563EB)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                    </div>

                    {/* Lectures list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {subject.lectures.slice(0, 5).map(lecture => (
                        <Link
                          key={lecture.id}
                          href={`/${subject.universityId}/${subject.id}/${lecture.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: '#F8FAFC', textDecoration: 'none', transition: 'background 0.15s' }}
                        >
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: lecture.completed ? '#16A34A' : lecture.progress > 0 ? '#2563EB' : '#CBD5E1', flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lecture.title}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: lecture.completed ? '#16A34A' : '#2563EB', flexShrink: 0 }}>{lecture.progress}%</span>
                        </Link>
                      ))}
                      {subject.lectures.length > 5 && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
                          +{subject.lectures.length - 5} more lectures
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Summary card */}
          <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Summary</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SummaryRow label="Total Progress" value={`${totalProgress}%`} color="#2563EB" percent={totalProgress} />
              <SummaryRow label="Completed" value={`${completedLectures}/${totalLectures}`} color="#16A34A" percent={totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0} />
              <SummaryRow label="Subjects" value={`${subjects.length}`} color="#7C3AED" percent={100} />
              <SummaryRow label="Bookmarks" value={`${bookmarksCount ?? 0}`} color="#D97706" percent={100} />
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: '#A0A8B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Activity</p>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentActivity.map((p, i) => {
                  const lecture = p.lectures as any
                  const typeStyle = CONTENT_TYPE_COLORS[p.content_type] ?? { bg: '#F1F5F9', color: '#64748B' }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: typeStyle.bg, color: typeStyle.color, flexShrink: 0 }}>
                        {CONTENT_TYPE_LABELS[p.content_type] ?? p.content_type}
                      </span>
                      <span style={{ flex: 1, fontSize: '12px', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lecture?.title ?? 'Lecture'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8', flexShrink: 0 }}>
                        {formatDate(p.last_accessed_at)}
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
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
  bg: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        {icon}
      </div>
      <p style={{ margin: '0 0 2px', fontSize: '26px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{sub}</p>
    </div>
  )
}
function SummaryRow({ label, value, color, percent }: { label: string; value: string; color: string; percent: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: '5px', background: '#EEF0F4', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}