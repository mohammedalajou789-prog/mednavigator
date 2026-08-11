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

  // ── Parallel: auth + university ──────────────────────────────────────────
  let userId: string | null = null
  const [profileResult, { data: university }] = await Promise.all([
    (async () => { try { const p = await requireAuth(); return p } catch { return null } })(),
    supabase
      .from('universities')
      .select(`
        id,
        name,
        logo_url,
        description,
        country,
        subjects!inner (
          id,
          name,
          slug,
          subject_type,
          category,
          access_mode,
          description
        )
      `)
      .eq('slug' as any, uniSlug)
      .eq('subjects.is_published' as any, true)
      .order('name', { referencedTable: 'subjects' })
      .single() as any,
  ])
  userId = profileResult?.id ?? null
  if (!university) notFound()

  // ── Fetch pinned subjects ────────────────────────────────────────────────
  const pinnedIds: string[] = []
  if (userId) {
    const subjectIds = (university.subjects ?? []).map((s: any) => s.id)
    if (subjectIds.length > 0) {
      const { data: pinned } = await supabase
        .from('pinned_subjects')
        .select('subject_id')
        .eq('user_id', userId)
        .in('subject_id', subjectIds)
      ;(pinned ?? []).forEach((p: any) => pinnedIds.push(p.subject_id))
    }
  }

  const subjectList = (university.subjects ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    subject_type: string
    category: string | null
    access_mode: string
    description: string | null
  }>

  // ── Build sections ───────────────────────────────────────────────────────
  const preclinical   = subjectList.filter(s => s.category === 'preclinical')
  const clinicalMajor = subjectList.filter(s => s.category === 'clinical_major')
  const clinicalMinor = subjectList.filter(s => s.category === 'clinical_minor')
  const other         = subjectList.filter(
    s => !['preclinical', 'clinical_major', 'clinical_minor'].includes(s.category ?? '')
  )

  const sections = [
    { key: 'preclinical',    label: 'PRE-CLINICAL',    tabLabel: 'Pre-Clinical', list: preclinical,   barGradient: 'linear-gradient(180deg,#16A34A,#059669)' },
    { key: 'clinical_major', label: 'CLINICAL – MAJOR', tabLabel: 'Majors',      list: clinicalMajor, barGradient: 'linear-gradient(180deg,#2563EB,#7C3AED)' },
    { key: 'clinical_minor', label: 'CLINICAL – MINOR', tabLabel: 'Minors',      list: clinicalMinor, barGradient: 'linear-gradient(180deg,#D97706,#EA580C)' },
    ...(other.length > 0
      ? [{ key: 'other', label: 'GENERAL', tabLabel: 'General', list: other, barGradient: 'linear-gradient(180deg,#9AA3B2,#64748B)' }]
      : []),
  ].filter(s => s.list.length > 0)

  return (
    <UniversityClient
      university={{
        id:          university.id,
        name:        university.name,
        logo_url:    university.logo_url   ?? null,
        description: university.description ?? null,
        country:     university.country    ?? null,
      }}
      subjectList={subjectList}
      sections={sections}
      pinnedIds={pinnedIds}
      userId={userId}
      uniSlug={uniSlug}
    />
  )
}