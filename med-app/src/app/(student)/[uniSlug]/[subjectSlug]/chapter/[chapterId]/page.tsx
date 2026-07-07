import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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

  const totalFlash = Object.values(flashMap).reduce((s, n) => s + n, 0)
  const totalQuiz  = Object.values(quizMap).reduce((s, n) => s + n, 0)

  // Ring: r=45, circ=2*π*45≈282.74
  const ringCirc   = 282.74
  const ringOffset = ringCirc * (1 - progressPercent / 100)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(245, 247, 252)',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      color: 'rgb(60, 70, 97)',
    }}>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 34px 80px' }}>

        {/* ── Breadcrumb ── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
          <Link href="/home" style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <Link href={`/${uniSlug}`} style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>{uniRow.name}</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <Link href={`/${uniSlug}/${subjectSlug}`} style={{ color: 'rgb(107, 118, 144)', textDecoration: 'none' }}>{subRow.name}</Link>
          <span style={{ color: 'rgb(194, 202, 219)' }}>/</span>
          <span style={{ color: 'rgb(21, 32, 58)' }}>{groupRow.title}</span>
        </nav>

        {/* ── Back Button ── */}
        <Link
          href={`/${uniSlug}/${subjectSlug}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            marginBottom: 18, padding: '8px 15px',
            borderRadius: 11, border: '1px solid rgb(228, 234, 245)',
            background: 'rgb(255, 255, 255)', color: 'rgb(85, 97, 125)',
            fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
            transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to {subRow.name}
        </Link>

        {/* ── Chapter Hero Banner ── */}
        <section style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 22, padding: '28px 32px', marginBottom: 30,
          background: 'linear-gradient(120deg, rgb(237, 243, 255) 0%, rgb(243, 247, 255) 52%, rgb(252, 253, 255) 100%)',
          border: '1px solid rgb(226, 234, 251)',
          boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px, rgba(40, 90, 200, 0.5) 0px 24px 50px -34px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 30 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 800, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: 'rgb(47, 107, 255)', marginBottom: 8,
              }}>
                {groupLabel}
              </div>
              <h1 style={{
                margin: 0, fontSize: 34, lineHeight: 1.08,
                fontWeight: 800, letterSpacing: '-0.03em', color: 'rgb(21, 32, 58)',
              }}>
                {groupRow.title}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 16, fontSize: 13.5, fontWeight: 600, color: 'rgb(136, 146, 168)' }}>
                <span>{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{Math.floor(totalStars / 3)} of {totalLectures} reviewed</span>
                {totalFlash > 0 && <><span>·</span><span>{totalFlash} flashcards</span></>}
                {totalQuiz > 0  && <><span>·</span><span>{totalQuiz} questions</span></>}
              </div>
            </div>

            {/* Progress Ring */}
            <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
              <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="54" cy="54" r="45" fill="none" stroke="#E1E9FA" strokeWidth="10" />
                <circle
                  cx="54" cy="54" r="45" fill="none"
                  stroke="url(#chRing)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
                />
                <defs>
                  <linearGradient id="chRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3B79FF" />
                    <stop offset="1" stopColor="#2456D6" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: 'rgb(36, 86, 214)',
              }}>
                {progressPercent}%
              </div>
            </div>
          </div>
        </section>

        {/* ── Lectures Section ── */}
        <div>
          <h2 style={{ margin: '0 0 18px', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'rgb(21, 32, 58)' }}>
            Lectures
          </h2>

          {lectureList.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'rgb(136, 146, 168)', fontSize: 14 }}>
              No lectures in this {groupLabel.toLowerCase()} yet.
            </div>
          ) : lectureList.map((lecture: any) => {
            const lectureStars = starsByLecture[lecture.id] ?? 0
            const isMastered   = lectureStars === 3
            const lectureSlug  = lecture.slug ?? lecture.id

            const statusLabel = isMastered ? 'Mastered' : lectureStars === 2 ? 'Almost There' : lectureStars === 1 ? 'Need Review' : 'Not started'
            const statusColor = isMastered ? 'rgb(19, 138, 90)' : lectureStars > 0 ? 'rgb(161, 115, 10)' : 'rgb(136, 146, 168)'
            const statusBg    = isMastered ? 'rgba(19,138,90,0.11)' : lectureStars > 0 ? 'rgba(216,154,6,0.11)' : 'rgb(241, 243, 249)'

            // Icon badge
            const iconBg    = isMastered ? 'rgb(231, 247, 239)' : 'rgb(238, 241, 248)'
            const iconColor = isMastered ? 'rgb(23, 166, 107)' : 'rgb(154, 164, 188)'
            const iconMark  = isMastered ? '✓' : '•'

            // Meta text
            const metaParts: string[] = []
            if ((flashMap[lecture.id] ?? 0) > 0) metaParts.push(`${flashMap[lecture.id]} flashcards`)
            if ((quizMap[lecture.id]  ?? 0) > 0) metaParts.push(`${quizMap[lecture.id]} questions`)
            if (sheetMap[lecture.id])             metaParts.unshift('1 sheet')
            const metaText = metaParts.join(' · ')

            // Star colors
            const starFills = [
              lectureStars >= 1 ? '#EF4444' : '#CBD5E1',
              lectureStars >= 2 ? '#F59E0B' : '#CBD5E1',
              lectureStars >= 3 ? '#22C55E' : '#CBD5E1',
            ]

            return (
              <div
                key={lecture.id}
                style={{
                  borderRadius: 18,
                  border: '1px solid rgb(231, 236, 246)',
                  background: 'rgb(255, 255, 255)',
                  padding: '20px 24px',
                  marginBottom: 14,
                  boxShadow: 'rgba(16, 24, 40, 0.04) 0px 1px 2px',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>

                  {/* Icon */}
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 44, height: 44, borderRadius: 12,
                    background: iconBg, color: iconColor,
                    flexShrink: 0, fontSize: 18, fontWeight: 800,
                  }}>
                    {iconMark}
                  </span>

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'rgb(21, 32, 58)' }}>
                      {lecture.title}
                    </div>
                    {metaText && (
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(154, 164, 188)', marginTop: 3 }}>
                        {metaText}
                      </div>
                    )}
                  </div>

                  {/* Stars */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    {userId ? (
                      <LectureStarsClient
                        lectureId={lecture.id}
                        initialStars={lectureStars}
                        userId={userId}
                      />
                    ) : (
                      starFills.map((fill, i) => (
                        <span key={i} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.15)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={fill} stroke={fill} strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </span>
                      ))
                    )}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    padding: '5px 11px', borderRadius: 8,
                    fontSize: 11.5, fontWeight: 700,
                    background: statusBg, color: statusColor,
                    flexShrink: 0,
                  }}>
                    {statusLabel}
                  </span>

                  {/* View lecture link */}
                  <Link
                    href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`}
                    prefetch={false}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 13.5, fontWeight: 700,
                      color: 'rgb(47, 107, 255)', textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    View lecture
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </div>
  )
}