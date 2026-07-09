import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ChapterProgressClient from '@/components/student/ChapterProgressClient'

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
      <main style={{ width: '100%', padding: 'clamp(16px, 4vw, 30px) clamp(16px, 4vw, 34px) 80px' }}>

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

            <ChapterProgressClient
          uniSlug={uniSlug}
          subjectSlug={subjectSlug}
          groupLabel={groupLabel}
          groupTitle={groupRow.title}
          totalLectures={totalLectures}
          totalFlash={totalFlash}
          totalQuiz={totalQuiz}
          lectureList={lectureList}
          initialStarsByLecture={starsByLecture}
          sheetMap={sheetMap}
          flashMap={flashMap}
          quizMap={quizMap}
          userId={userId}
        />



      </main>
    </div>
  )
}