import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChapterProgressHeader from '@/components/student/ChapterProgressHeader'
import LectureStarsClient from '@/components/student/LectureStarsClient'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string; chapterId: string }>
}

export default async function ChapterPage({ params }: PageProps) {
  const { uniSlug, subjectSlug, chapterId } = await params

  const supabase = await createServerClient()
  const [{ data: uniRow }, { data: subRow }, authUser] = await Promise.all([
    supabase.from('universities').select('id,name').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id,name,subject_type').eq('slug' as any, subjectSlug).eq('is_published', true).single(),
    getAuthUser(),
  ])
  if (!uniRow || !subRow) notFound()

  const subjectId  = subRow.id
  const isSystem   = subRow.subject_type === 'system'
  const groupLabel = isSystem ? 'Sub-Subject' : 'Chapter'

  const groupTable = isSystem ? 'sub_subjects' : 'chapters'
  const { data: groupRow } = await (supabase.from(groupTable as any) as any)
    .select('id,title')
    .eq('slug' as any, chapterId)
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .single()
  if (!groupRow) notFound()

  let userId: string | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_user_id', authUser.id).single()
    userId = profile?.id ?? null
  }

  const colName = isSystem ? 'sub_subject_id' : 'chapter_id'
  const { data: lectures } = await (supabase.from('lectures') as any)
    .select('id,title,display_order,slug')
    .eq('subject_id', subjectId)
    .eq(colName, groupRow.id)
    .eq('status', 'published')
    .order('display_order')

  const lectureList = (lectures ?? []) as any[]
  const lectureIds  = lectureList.map((l: any) => l.id)

  const sheetMap:   Record<string, boolean> = {}
  const summaryMap: Record<string, boolean> = {}
  const flashMap:   Record<string, number>  = {}
  const quizMap:    Record<string, number>  = {}
  const pyqMap:     Record<string, number>  = {}

  if (lectureIds.length > 0) {
    const [{ data: sheets }, { data: summaries }, { data: contentCounts }] = await Promise.all([
      supabase.from('sheets').select('lecture_id').in('lecture_id', lectureIds).eq('status', 'published'),
      supabase.from('summaries').select('lecture_id').in('lecture_id', lectureIds).eq('status', 'published'),
      supabase.rpc('get_content_counts_by_lecture' as any, { lecture_ids: lectureIds }),
    ])
    sheets?.forEach((r: any)    => { sheetMap[r.lecture_id]   = true })
    summaries?.forEach((r: any) => { summaryMap[r.lecture_id] = true })
    contentCounts?.forEach((r: any) => {
      flashMap[r.lecture_id] = r.flashcards_count ?? 0
      quizMap[r.lecture_id]  = r.quiz_count ?? 0
      pyqMap[r.lecture_id]   = r.pyq_count ?? 0
    })
  }

  type ChecklistRow = { lecture_id: string; stars: number }
  let checklistRows: ChecklistRow[] = []

  if (userId && lectureIds.length > 0) {
    const { data } = await supabase
      .from('checklist_progress')
      .select('lecture_id,stars')
      .eq('user_id', userId)
      .in('lecture_id', lectureIds)
    checklistRows = (data ?? []) as ChecklistRow[]
  }

  const starsByLecture: Record<string, number> = {}
  checklistRows.forEach(r => { starsByLecture[r.lecture_id] = r.stars })

  const totalStars      = Object.values(starsByLecture).reduce((s, n) => s + n, 0)
  const totalLectures   = lectureList.length
  const progressPercent = totalLectures > 0 ? Math.round((totalStars / (totalLectures * 3)) * 100) : 0

  // Ring SVG params (r=54, circ=2*π*54≈339.3)
  const ringR    = 54
  const ringCirc = 2 * Math.PI * ringR // 339.3
  const ringOffset = ringCirc * (1 - progressPercent / 100)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(245, 247, 252)',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      color: 'rgb(60, 70, 97)',
    }}>
      <main style={{ padding: '30px 0 80px' }}>

        {/* ── Breadcrumb ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontSize: 13.5, fontWeight: 600, marginBottom: 20,
          padding: '0 34px',
        }}>
          <Link href="/home" style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <Link href={`/${uniSlug}`} style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>{uniRow.name}</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <Link href={`/${uniSlug}/${subjectSlug}`} style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>{subRow.name}</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <span style={{ color: 'rgb(21, 32, 58)' }}>{groupRow.title}</span>
        </nav>

        {/* ── Chapter Hero Banner ── */}
        <section style={{
          position: 'relative',
          overflow: 'hidden',
          margin: '0 34px 28px',
          borderRadius: 22,
          padding: '28px 34px',
          background: 'linear-gradient(120deg, rgb(237, 243, 255) 0%, rgb(243, 247, 255) 52%, rgb(252, 253, 255) 100%)',
          border: '1px solid rgb(226, 234, 251)',
          boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px, rgba(40, 90, 200, 0.5) 0px 24px 50px -34px',
        }}>
          {/* decorative glow */}
          <div style={{
            position: 'absolute', top: -40, right: 200,
            width: 280, height: 160,
            background: 'radial-gradient(rgba(147, 197, 253, 0.32) 0%, rgba(196, 181, 253, 0.12) 55%, transparent 75%)',
            filter: 'blur(28px)', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 30, position: 'relative' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 800, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: 'rgb(47, 107, 255)', marginBottom: 10,
              }}>
                {groupLabel}
              </div>
              <h1 style={{
                margin: '0 0 12px',
                fontSize: 'clamp(26px, 5vw, 38px)',
                fontWeight: 800, letterSpacing: '-0.03em',
                color: 'rgb(21, 32, 58)', lineHeight: 1.08,
              }}>
                {groupRow.title}
              </h1>
              <div style={{ display: 'flex', gap: 20, fontSize: 13.5, fontWeight: 600, color: 'rgb(107, 118, 144)' }}>
                <span>{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}</span>
                <span>{Math.floor(totalStars / 3)} of {totalLectures} reviewed</span>
              </div>
            </div>

            {/* Progress ring */}
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="62" cy="62" r={ringR} fill="none" stroke="#E1E9FA" strokeWidth="11" />
                <circle
                  cx="62" cy="62" r={ringR} fill="none"
                  stroke="url(#chapterRing)" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)' }}
                />
                <defs>
                  <linearGradient id="chapterRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3B79FF" />
                    <stop offset="1" stopColor="#2456D6" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'rgb(36, 86, 214)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {progressPercent}%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Lectures List ── */}
        <div style={{
          margin: '0 34px',
          background: 'rgb(255, 255, 255)',
          border: '1px solid rgb(231, 236, 246)',
          borderRadius: 20,
          boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px, rgba(40, 90, 200, 0.3) 0px 12px 30px -20px',
          overflow: 'hidden',
        }}>
          {lectureList.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'rgb(136, 146, 168)', fontSize: 14 }}>
              No lectures in this {groupLabel.toLowerCase()} yet.
            </div>
          ) : lectureList.map((lecture: any, idx: number) => {
            const lectureStars = starsByLecture[lecture.id] ?? 0
            const starsPct     = Math.round((lectureStars / 3) * 100)
            const hasSheet     = sheetMap[lecture.id]   ?? false
            const hasSummary   = summaryMap[lecture.id] ?? false
            const hasFl        = (flashMap[lecture.id]  ?? 0) > 0
            const hasQuiz      = (quizMap[lecture.id]   ?? 0) > 0
            const hasPYQ       = (pyqMap[lecture.id]    ?? 0) > 0
            const lectureSlug  = lecture.slug ?? lecture.id

            const isMastered   = lectureStars === 3
            const statusLabel  = isMastered ? 'Mastered' : lectureStars === 2 ? 'Almost There' : lectureStars === 1 ? 'Need Review' : 'Not started'
            const statusColor  = isMastered ? 'rgb(19, 138, 90)' : lectureStars > 0 ? 'rgb(161, 115, 10)' : 'rgb(136, 146, 168)'
            const statusBg     = isMastered ? 'rgba(19,138,90,0.11)' : lectureStars > 0 ? 'rgba(216,154,6,0.11)' : 'rgb(241, 243, 249)'

            // Star colors: red, amber, green
            const starColors = ['#EF4444', '#F59E0B', '#22C55E']
            const emptyStarColor = '#CBD5E1'

            return (
              <div key={lecture.id}>
                {idx > 0 && (
                  <div style={{ height: 1, background: 'rgb(231, 236, 246)' }} />
                )}
                <div style={{ padding: '22px 24px' }}>

                  {/* Row: icon + title + stars + status */}
                  <Link
                    href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`}
                    prefetch={false}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit' }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isMastered ? 'rgba(19,138,90,0.11)' : 'rgba(47,107,255,0.10)',
                      color: isMastered ? 'rgb(19, 138, 90)' : 'rgb(47, 107, 255)',
                    }}>
                      {isMastered ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Title + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: 'rgb(21, 32, 58)', letterSpacing: '-0.01em' }}>
                        {lecture.title}
                      </div>
                      {((flashMap[lecture.id] ?? 0) > 0 || (quizMap[lecture.id] ?? 0) > 0) && (
                        <div style={{ fontSize: 13, color: 'rgb(136, 146, 168)', fontWeight: 600, marginTop: 3 }}>
                          {(flashMap[lecture.id] ?? 0) > 0 && `${flashMap[lecture.id]} flashcards`}
                          {(flashMap[lecture.id] ?? 0) > 0 && (quizMap[lecture.id] ?? 0) > 0 && ' · '}
                          {(quizMap[lecture.id]  ?? 0) > 0 && `${quizMap[lecture.id]} questions`}
                        </div>
                      )}
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {userId ? (
                        <LectureStarsClient
                          lectureId={lecture.id}
                          initialStars={lectureStars}
                          userId={userId}
                        />
                      ) : (
                        <div style={{ display: 'flex', gap: 3 }}>
                          {starColors.map((c, i) => (
                            <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill={i < lectureStars ? c : emptyStarColor} stroke={i < lectureStars ? c : emptyStarColor} strokeWidth="1">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      )}

                      {/* Status badge */}
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: statusColor,
                        padding: '5px 13px', borderRadius: 8,
                        background: statusBg,
                        whiteSpace: 'nowrap',
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                  </Link>

                  {/* Progress bar */}
                  <div style={{ height: 5, background: 'rgb(234, 240, 251)', margin: '16px 0 14px', borderRadius: 999 }}>
                    <div style={{
                      height: '100%',
                      width: `${starsPct}%`,
                      background: isMastered
                        ? 'linear-gradient(90deg, rgb(23, 166, 107), rgb(16, 128, 81))'
                        : 'linear-gradient(90deg, rgb(59, 121, 255), rgb(36, 86, 214))',
                      borderRadius: 999,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>

                  {/* Content chips */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {hasSheet && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        height: 36, padding: '0 14px', borderRadius: 9,
                        border: '1px solid rgba(47,107,255,0.3)',
                        background: 'rgba(47,107,255,0.09)',
                        color: 'rgb(47, 107, 255)',
                        fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        Sheet
                      </Link>
                    )}
                    {hasSummary && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        height: 36, padding: '0 14px', borderRadius: 9,
                        border: '1px solid rgb(228, 234, 245)',
                        background: 'rgb(248, 250, 254)',
                        color: 'rgb(85, 97, 125)',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        Summary
                      </Link>
                    )}
                    {hasFl && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        height: 36, padding: '0 14px', borderRadius: 9,
                        border: '1px solid rgb(228, 234, 245)',
                        background: 'rgb(248, 250, 254)',
                        color: 'rgb(85, 97, 125)',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                        Flashcards
                      </Link>
                    )}
                    {hasQuiz && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        height: 36, padding: '0 14px', borderRadius: 9,
                        border: '1px solid rgb(228, 234, 245)',
                        background: 'rgb(248, 250, 254)',
                        color: 'rgb(85, 97, 125)',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Quiz
                      </Link>
                    )}
                    {hasPYQ && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        height: 36, padding: '0 14px', borderRadius: 9,
                        border: '1px solid rgb(228, 234, 245)',
                        background: 'rgb(248, 250, 254)',
                        color: 'rgb(85, 97, 125)',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Previous Years
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </div>
  )
}