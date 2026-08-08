import { readFileSync, writeFileSync } from 'fs'

const path = "C:\\Users\\mohammed alajou\\Documents\\mednavigator\\med-app\\src\\app\\(student)\\[uniSlug]\\[subjectSlug]\\page.tsx"

let content = readFileSync(path, 'utf8')

// Fix 1 — Replace import
const oldImport = `import { getAuthUser } from '@/lib/services/user'`
const newImport = `import { getUserProfile } from '@/lib/services/user'`
content = content.replace(oldImport, newImport)

// Fix 2 — Replace the entire data fetching block (3 waves → 2 waves)
const oldBlock = `  const [
    { data: uniRow },
    { data: subRow },
    authUser,
  ] = await Promise.all([
    supabase.from('universities').select('id, name').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id, name, description, access_mode, subject_type').eq('slug' as any, subjectSlug).eq('is_published', true).single(),
    getAuthUser(),
  ])
  if (!uniRow || !subRow) notFound()
  const universityId = uniRow.id
  const subjectId    = subRow.id
  const university   = uniRow
  const subject      = subRow
  let userId: string | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users').select('id').eq('auth_user_id', authUser.id).single()
    userId = profile?.id ?? null
  }
  const isSystem = subject.subject_type === 'system'
  const [
    { data: chapters },
    { data: subSubjects },
    { data: lectures },
    { data: videos },
    { data: clinicalModules },
  ] = await Promise.all([
    supabase.from('chapters').select('id,title,display_order,slug').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('sub_subjects').select('id,title,display_order,slug').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('lectures').select('id,title,chapter_id,sub_subject_id,display_order,slug' as any).eq('subject_id', subjectId).eq('status', 'published').order('display_order') as any,
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])`

const newBlock = `  // Wave 1 — resolve slugs + auth in parallel
  const [
    { data: uniRow },
    { data: subRow },
    profile,
  ] = await Promise.all([
    supabase.from('universities').select('id, name').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id, name, description, access_mode, subject_type').eq('slug' as any, subjectSlug).eq('is_published', true).single(),
    getUserProfile(),
  ])
  if (!uniRow || !subRow) notFound()
  const universityId = uniRow.id
  const subjectId    = subRow.id
  const university   = uniRow
  const subject      = subRow
  const userId       = profile?.id ?? null
  const isSystem     = subject.subject_type === 'system'

  // Wave 2 — fetch all content in parallel (no sequential waits)
  const [
    { data: chapters },
    { data: subSubjects },
    { data: lectures },
    { data: videos },
    { data: clinicalModules },
  ] = await Promise.all([
    supabase.from('chapters').select('id,title,display_order,slug').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('sub_subjects').select('id,title,display_order,slug').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('lectures').select('id,title,chapter_id,sub_subject_id,display_order,slug' as any).eq('subject_id', subjectId).eq('status', 'published').order('display_order') as any,
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])`

content = content.replace(oldBlock, newBlock)

// Fix 3 — Move content_counts and checklist into Wave 2
const oldWave3 = `  const flashMap: Record<string, number> = {}
  const quizMap:  Record<string, number> = {}
  const pyqMap:   Record<string, number> = {}
  if (lectureIds.length > 0) {
    const { data: contentCounts } = await supabase.rpc('get_content_counts_by_lecture' as any, { lecture_ids: lectureIds })
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
  }`

const newWave3 = `  const flashMap: Record<string, number> = {}
  const quizMap:  Record<string, number> = {}
  const pyqMap:   Record<string, number> = {}
  type ChecklistRow = { lecture_id: string; stars: number }
  let checklistRows: ChecklistRow[] = []

  if (lectureIds.length > 0) {
    // Wave 3 — content counts + checklist in parallel
    const [contentCountsResult, checklistResult] = await Promise.all([
      supabase.rpc('get_content_counts_by_lecture' as any, { lecture_ids: lectureIds }),
      userId
        ? supabase.from('checklist_progress').select('lecture_id,stars').eq('user_id', userId).in('lecture_id', lectureIds)
        : Promise.resolve({ data: [] }),
    ])
    contentCountsResult.data?.forEach((r: any) => {
      flashMap[r.lecture_id] = r.flashcards_count ?? 0
      quizMap[r.lecture_id]  = r.quiz_count ?? 0
      pyqMap[r.lecture_id]   = r.pyq_count ?? 0
    })
    checklistRows = ((checklistResult.data ?? []) as ChecklistRow[])
  }`

content = content.replace(oldWave3, newWave3)

writeFileSync(path, content, 'utf8')
console.log('done')
console.log('verify import:', content.includes('getUserProfile'))
console.log('verify wave1:', content.includes('Wave 1'))
console.log('verify wave3 parallel:', content.includes('Wave 3'))
console.log('verify no sequential auth:', !content.includes('getAuthUser'))