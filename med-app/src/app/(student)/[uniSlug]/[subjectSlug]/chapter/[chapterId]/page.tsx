import { getAuthUser } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BfCacheReloader from '@/components/student/BfCacheReloader'
import ChapterProgressClient from '@/components/student/ChapterProgressClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string; chapterId: string }>
}

export default async function ChapterPage({ params }: PageProps) {
  const { uniSlug, subjectSlug, chapterId } = await params

  const supabase = await createServerClient()

  // ── Wave 1: all slug resolution + auth in parallel ────────────────────────
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
  const colName    = isSystem ? 'sub_subject_id' : 'chapter_id'

  // ── Wave 2: groupRow + profile in parallel ────────────────────────────────
  const [{ data: groupRow }, profileResult] = await Promise.all([
    (supabase.from(groupTable as any) as any)
      .select('id,title')
      .eq('slug' as any, chapterId)
      .eq('subject_id', subjectId)
      .is('archived_at', null)
      .single(),
    authUser
      ? supabase.from('users').select('id').eq('auth_user_id', authUser.id).single()
      : Promise.resolve({ data: null }),
  ])
  if (!groupRow) notFound()

  const userId: string | null = (profileResult as any).data?.id ?? null

  // ── Wave 3: single RPC call replaces 5 separate queries ──────────────────
  const { data: rpcData } = await (supabase as any).rpc('get_chapter_page_data', {
    p_group_id:  groupRow.id,
    p_is_system: isSystem,
    p_user_id:   userId ?? null,
  })

  const lectureList: any[] = rpcData?.lectures ?? []
  const checklistMap: Record<string, number> = rpcData?.checklist ?? {}

  const lectureIds  = lectureList.map((l: any) => l.id)
  const totalLectures = lectureList.length

  const sheetMap:  Record<string, boolean> = {}
  const flashMap:  Record<string, number>  = {}
  const quizMap:   Record<string, number>  = {}

  lectureList.forEach((l: any) => {
    if (l.has_sheet)    sheetMap[l.id]  = true
    if (l.flash_count)  flashMap[l.id]  = l.flash_count
    if (l.quiz_count)   quizMap[l.id]   = l.quiz_count
  })

  const totalFlash = Object.values(flashMap).reduce((s, n) => s + n, 0)
  const totalQuiz  = Object.values(quizMap).reduce((s, n) => s + n, 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(245, 247, 252)',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      color: 'rgb(60, 70, 97)',
    }}>
      <BfCacheReloader />
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
          initialStarsByLecture={checklistMap}
          sheetMap={sheetMap}
          flashMap={flashMap}
          quizMap={quizMap}
          userId={userId}
        />

      </main>
    </div>
  )
}
