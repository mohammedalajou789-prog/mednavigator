import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/services/user'
import UniversityClient from './UniversityClient'

interface PageProps {
  params: Promise<{ uniSlug: string }>
}

export default async function UniversityPage({ params }: PageProps) {
  const { uniSlug } = await params
  const supabase = await createServerClient()

  let userId: string | null = null
  const [profileResult, { data: university }] = await Promise.all([
    (async () => { try { const p = await requireAuth(); return p } catch { return null } })(),
    supabase
      .from('universities')
      .select(`
        id, name, logo_url, description, country,
        subjects!inner (
          id, name, slug, subject_type, category, access_mode, description,
          lectures ( id ),
          chapters ( id )
        )
      `)
      .eq('slug' as any, uniSlug)
      .eq('subjects.is_published' as any, true)
      .order('name', { referencedTable: 'subjects' })
      .single() as any,
  ])
  userId = profileResult?.id ?? null
  if (!university) notFound()

  // Build lecture -> subject map
  const allLectureIds: string[] = []
  const lectureToSubject: Record<string, string> = {}
  for (const s of (university.subjects ?? [])) {
    for (const l of (s.lectures ?? [])) {
      allLectureIds.push(l.id)
      lectureToSubject[l.id] = s.id
    }
  }

  const savedIds: string[] = []
  const progressMap: Record<string, { stars: number; total: number }> = {}
  for (const s of (university.subjects ?? [])) {
    progressMap[s.id] = { stars: 0, total: (s.lectures ?? []).length }
  }

  if (userId) {
    const subjectIds = (university.subjects ?? []).map((s: any) => s.id)
    const [pinnedResult, checklistResult] = await Promise.all([
      subjectIds.length > 0
        ? supabase.from('pinned_subjects').select('subject_id').eq('user_id', userId).in('subject_id', subjectIds)
        : Promise.resolve({ data: [] }),
      allLectureIds.length > 0
        ? supabase.from('checklist_progress').select('lecture_id, stars').eq('user_id', userId).in('lecture_id', allLectureIds)
        : Promise.resolve({ data: [] }),
    ])
    ;(pinnedResult.data ?? []).forEach((p: any) => savedIds.push(p.subject_id))
    for (const row of (checklistResult.data ?? [])) {
      const sid = lectureToSubject[row.lecture_id]
      if (sid && progressMap[sid]) progressMap[sid].stars += row.stars ?? 0
    }
  }

  const subjectList = (university.subjects ?? []).map((s: any) => {
    const prog     = progressMap[s.id] ?? { stars: 0, total: 0 }
    const pct      = prog.total > 0 ? Math.round((prog.stars / (prog.total * 3)) * 100) : 0
    const mastered = prog.total > 0 ? Math.floor(prog.stars / 3) : 0
    return {
      id: s.id, name: s.name, slug: s.slug ?? null,
      subject_type: s.subject_type, category: s.category ?? null,
      access_mode: s.access_mode, description: s.description ?? null,
      lecture_count:  Array.isArray(s.lectures) ? s.lectures.length : 0,
      chapter_count:  Array.isArray(s.chapters) ? s.chapters.length : 0,
      progress_pct:   pct,
      mastered_count: mastered,
    }
  })

  const preclinical   = subjectList.filter((s: any) => s.category === 'preclinical')
  const clinicalMajor = subjectList.filter((s: any) => s.category === 'clinical_major')
  const clinicalMinor = subjectList.filter((s: any) => s.category === 'clinical_minor')
  const other         = subjectList.filter((s: any) => !['preclinical','clinical_major','clinical_minor'].includes(s.category ?? ''))

  const sections = [
    { key:'preclinical',    label:'PRE-CLINICAL',     tabLabel:'Pre-Clinical', list:preclinical,   barColor:'linear-gradient(180deg,#16A34A,#059669)' },
    { key:'clinical_major', label:'CLINICAL - MAJOR', tabLabel:'Majors',       list:clinicalMajor, barColor:'linear-gradient(180deg,#2563EB,#7C3AED)' },
    { key:'clinical_minor', label:'CLINICAL - MINOR', tabLabel:'Minors',       list:clinicalMinor, barColor:'linear-gradient(180deg,#D97706,#EA580C)' },
    ...(other.length > 0 ? [{ key:'other', label:'GENERAL', tabLabel:'General', list:other, barColor:'linear-gradient(180deg,#9AA3B2,#64748B)' }] : []),
  ].filter(s => s.list.length > 0)

  return (
    <UniversityClient
      university={{ id:university.id, name:university.name, logo_url:university.logo_url??null, description:university.description??null, country:university.country??null }}
      subjectList={subjectList}
      sections={sections}
      savedIds={savedIds}
      userId={userId}
      uniSlug={uniSlug}
    />
  )
}
