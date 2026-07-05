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

  // Resolve the chapter or sub_subject
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

  // Lectures in this chapter
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

  // ── STARS PROGRESS (checklist_progress) ───────────────────────────────────
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
          <Link href="/home" style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>Home</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <Link href={`/${uniSlug}`} style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>{uniRow.name}</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <Link href={`/${uniSlug}/${subjectSlug}`} style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>{subRow.name}</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{groupRow.title}</span>
        </div>

        {/* Chapter Header */}
        <ChapterProgressHeader
          totalLectures={totalLectures}
          initialStars={totalStars}
          initialStarsByLecture={starsByLecture}
          groupLabel={groupLabel}
          groupTitle={groupRow.title}
        />

        {/* Lectures List */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          {lectureList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
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

            // Star-based status
            const statusLabel = lectureStars === 3 ? 'Mastered' : lectureStars === 2 ? 'Almost There' : lectureStars === 1 ? 'Need Review' : 'Not started'
            const statusColor = lectureStars === 3 ? 'var(--success)' : lectureStars > 0 ? 'var(--warn)' : 'var(--ink-3)'
            const statusBg    = lectureStars === 3 ? 'rgba(19,138,90,0.11)' : lectureStars > 0 ? 'rgba(216,154,6,0.11)' : 'var(--bg-2)'

            return (
              <div key={lecture.id}>
                {idx > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 22px' }} />}
                <div style={{ padding: '20px 22px' }}>
                  <Link
                    href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`}
                    prefetch={false}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit', borderRadius: 12, padding: '8px 10px', margin: '-8px -10px', background: 'rgba(47,107,255,0.025)', border: '1px solid rgba(47,107,255,0.07)' }}
                  >
                    {/* Icon */}
                    <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: lectureStars === 3 ? 'rgba(19,138,90,0.11)' : 'rgba(47,107,255,0.11)', color: lectureStars === 3 ? 'var(--success)' : 'var(--primary)' }}>
                      {lectureStars === 3 ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
                      )}
                    </div>

                    {/* Title + subtitle */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{lecture.title}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
                        {(flashMap[lecture.id] ?? 0) > 0 && `${flashMap[lecture.id]} flashcards`}
                        {(flashMap[lecture.id] ?? 0) > 0 && (quizMap[lecture.id] ?? 0) > 0 && ' · '}
                        {(quizMap[lecture.id]  ?? 0) > 0 && `${quizMap[lecture.id]} questions`}
                      </div>
                    </div>

                    {/* Stars + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {userId && (
                        <LectureStarsClient
                          lectureId={lecture.id}
                          initialStars={lectureStars}
                          userId={userId}
                        />
                      )}
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: statusColor, padding: '5px 11px', borderRadius: 8, background: statusBg }}>
                        {statusLabel}
                      </span>
                    </div>
                  </Link>

                  {/* Progress bar — based on stars */}
                  <div style={{ height: 4, background: 'var(--bg-2)', margin: '14px 0 12px', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${starsPct}%`, background: lectureStars === 3 ? 'var(--success)' : 'var(--primary)', borderRadius: 99 }} />
                  </div>

                  {/* Content badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {hasSheet && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid color-mix(in srgb,var(--primary) 30%,var(--line))', background: 'rgba(47,107,255,0.09)', color: 'var(--primary)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        Sheet
                      </Link>
                    )}
                    {hasSummary && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        Summary
                      </Link>
                    )}
                    {hasFl && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        Flashcards
                      </Link>
                    )}
                    {hasQuiz && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Quiz
                      </Link>
                    )}
                    {hasPYQ && (
                      <Link href={`/${uniSlug}/${subjectSlug}/${lectureSlug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
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