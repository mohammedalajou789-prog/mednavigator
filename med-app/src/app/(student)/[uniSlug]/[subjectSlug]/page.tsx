'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LectureData {
  id: string
  title: string
  slug: string
  completed: boolean
  progress: number
  hasSheet: boolean
  hasSummary: boolean
  flashCount: number
  quizCount: number
  pyqCount: number
}

interface GroupData {
  id: string
  title: string
  lectures: LectureData[]
}

interface AccordionProps {
  groups: GroupData[]
  uniSlug: string
  subjectSlug: string
}

function ChapterAccordion({ groups, uniSlug, subjectSlug }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(groups[0]?.id ?? null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map(group => {
        const isOpen = openId === group.id
        const completedInGroup = group.lectures.filter(l => l.completed).length
        const totalInGroup = group.lectures.length
        const groupProgress = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0

        return (
          <div key={group.id} style={{ background: 'var(--card)', border: `1.5px solid ${isOpen ? 'rgba(47,107,255,0.35)' : 'var(--line)'}`, borderRadius: 18, boxShadow: isOpen ? '0 4px 24px rgba(47,107,255,0.08)' : 'var(--shadow)', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
            <button onClick={() => setOpenId(isOpen ? null : group.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isOpen ? 'rgba(47,107,255,0.13)' : 'var(--bg-2)', color: isOpen ? '#2F6BFF' : 'var(--ink-3)', transition: 'background 0.2s, color 0.2s' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>{group.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>{totalInGroup} lecture{totalInGroup !== 1 ? 's' : ''}</span>
                  {completedInGroup > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: completedInGroup === totalInGroup ? 'var(--success)' : '#A1730A', background: completedInGroup === totalInGroup ? 'rgba(19,138,90,0.1)' : 'rgba(234,179,8,0.1)', padding: '3px 10px', borderRadius: 999 }}>
                      {completedInGroup === totalInGroup ? '✓ All done' : `${completedInGroup}/${totalInGroup} done`}
                    </span>
                  )}
                </div>
                {groupProgress > 0 && (
                  <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 99, marginTop: 10, width: '100%', maxWidth: 320 }}>
                    <div style={{ height: '100%', width: `${groupProgress}%`, background: groupProgress === 100 ? 'var(--success)' : '#2F6BFF', borderRadius: 99 }} />
                  </div>
                )}
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#2F6BFF' : 'var(--ink-3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {group.lectures.map((lecture, idx) => {
                  const isDone = lecture.completed
                  const pct = lecture.progress
                  const statusLabel = isDone ? 'Completed' : pct > 0 ? `${pct}%` : 'Not started'
                  const statusColor = isDone ? 'var(--success)' : pct > 0 ? '#A1730A' : 'var(--ink-3)'
                  const statusBg    = isDone ? 'rgba(19,138,90,0.1)' : pct > 0 ? 'rgba(234,179,8,0.1)' : 'var(--bg-2)'
                  return (
                    <div key={lecture.id}>
                      {idx > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 22px' }} />}
                      <div style={{ padding: '16px 22px' }}>
                        <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit', borderRadius: 12, padding: '8px 10px', margin: '-8px -10px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'rgba(19,138,90,0.11)' : 'rgba(47,107,255,0.09)', color: isDone ? 'var(--success)' : 'var(--primary)' }}>
                            {isDone
                              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{lecture.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                              {lecture.flashCount > 0 && `${lecture.flashCount} flashcards`}
                              {lecture.flashCount > 0 && lecture.quizCount > 0 && ' · '}
                              {lecture.quizCount > 0 && `${lecture.quizCount} questions`}
                            </div>
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: statusColor, padding: '5px 11px', borderRadius: 8, background: statusBg, flexShrink: 0 }}>{statusLabel}</span>
                        </Link>
                        {pct > 0 && (
                          <div style={{ height: 3, background: 'var(--bg-2)', margin: '12px 0 10px', borderRadius: 99 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: isDone ? 'var(--success)' : '#2F6BFF', borderRadius: 99 }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: pct > 0 ? 0 : 12 }}>
                          {lecture.hasSheet && <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid rgba(47,107,255,0.25)', background: 'rgba(47,107,255,0.07)', color: '#2F6BFF', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Sheet</Link>}
                          {lecture.hasSummary && <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Summary</Link>}
                          {lecture.flashCount > 0 && <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Flashcards</Link>}
                          {lecture.quizCount > 0 && <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Quiz</Link>}
                          {lecture.pyqCount > 0 && <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>PYQ</Link>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface PageProps {
  params: Promise<{ uniSlug: string; subjectSlug: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params

  const { getAuthUser } = await import('@/lib/services/user')
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const { notFound } = await import('next/navigation')

  const supabase = await createServerClient()
  const [{ data: uniRow }, { data: subRow }, authUser] = await Promise.all([
    supabase.from('universities').select('id').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id').eq('slug' as any, subjectSlug).single(),
    getAuthUser(),
  ])
  const universityId = uniRow?.id ?? ''
  const subjectId    = subRow?.id ?? ''
  if (!universityId || !subjectId) notFound()

  let userId: string | null = null
  if (authUser) {
    const { data: profile } = await supabase.from('users').select('id').eq('auth_user_id', authUser.id).single()
    userId = profile?.id ?? null
  }

  const [{ data: university }, { data: subject }] = await Promise.all([
    supabase.from('universities').select('id,name').eq('id', universityId).single(),
    supabase.from('subjects').select('id,name,description,access_mode,subject_type').eq('id', subjectId).eq('is_published', true).single(),
  ])
  if (!university || !subject) notFound()

  const isSystem = subject!.subject_type === 'system'
  const subjectName        = subject!.name as string
  const subjectDescription = (subject!.description ?? '') as string
  const subjectType        = subject!.subject_type as string
  const accessMode         = (subject!.access_mode ?? '') as string
  const universityName     = university!.name as string

  const [{ data: chapters }, { data: subSubjects }, { data: lectures }, { data: videos }, { data: clinicalModules }] = await Promise.all([
    supabase.from('chapters').select('id,title,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('sub_subjects').select('id,title,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('lectures').select('id,title,chapter_id,sub_subject_id,is_preview,display_order,slug' as any).eq('subject_id', subjectId).eq('status', 'published').order('display_order') as any,
    supabase.from('videos').select('id,title,video_url,is_preview,display_order').eq('subject_id', subjectId).is('archived_at', null).order('display_order'),
    supabase.from('clinical_modules').select('id,module_type').eq('subject_id', subjectId).is('archived_at', null),
  ])

  const groups      = isSystem ? (subSubjects ?? []) : (chapters ?? [])
  const lectureList = lectures ?? []
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
    sheets?.forEach(r    => { sheetMap[r.lecture_id]   = true })
    summaries?.forEach(r => { summaryMap[r.lecture_id] = true })
    contentCounts?.forEach((r: any) => {
      flashMap[r.lecture_id] = r.flashcards_count ?? 0
      quizMap[r.lecture_id]  = r.quiz_count ?? 0
      pyqMap[r.lecture_id]   = r.pyq_count ?? 0
    })
  }

  type ProgressRow = { lecture_id: string; completed: boolean; content_type: string; last_accessed_at: string | null; progress_percentage: number }
  let progressRows: ProgressRow[] = []

  if (userId && lectureIds.length > 0) {
    const { data } = await supabase.from('user_progress').select('lecture_id,completed,content_type,last_accessed_at,progress_percentage').eq('user_id', userId).in('lecture_id', lectureIds)
    progressRows = (data ?? []) as ProgressRow[]
  }

  const progressByLecture: Record<string, ProgressRow> = {}
  progressRows.forEach(r => {
    if (!progressByLecture[r.lecture_id] || r.progress_percentage > progressByLecture[r.lecture_id].progress_percentage)
      progressByLecture[r.lecture_id] = r
  })

  const completedCount  = Object.values(progressByLecture).filter(r => r.completed).length
  const totalLectures   = lectureList.length
  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0

  const groupsData: GroupData[] = groups.map(group => {
    const groupLectures = lectureList.filter((l: any) => isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id)
    return {
      id: group.id,
      title: group.title,
      lectures: groupLectures.map((lecture: any) => {
        const lp = progressByLecture[lecture.id]
        return {
          id: lecture.id,
          title: lecture.title,
          slug: (lecture as any).slug ?? lecture.id,
          completed: lp?.completed ?? false,
          progress: lp?.progress_percentage ?? 0,
          hasSheet:   sheetMap[lecture.id]  ?? false,
          hasSummary: summaryMap[lecture.id] ?? false,
          flashCount: flashMap[lecture.id]  ?? 0,
          quizCount:  quizMap[lecture.id]   ?? 0,
          pyqCount:   pyqMap[lecture.id]    ?? 0,
        }
      }),
    }
  }).filter(g => g.lectures.length > 0)

  const typeBadge   = subjectType === 'system' ? 'System' : subjectType === 'standard' ? 'Standard' : 'Clinical'
  const accessBadge = accessMode  === 'free'   ? 'Free'   : accessMode  === 'mixed'    ? 'Mixed'    : 'Premium'
  const moduleLabels: Record<string, string> = { osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam' }
  const videoList = (videos ?? []) as { id: string; title: string; video_url: string }[]
  const clinicalList = (clinicalModules ?? []) as { id: string; module_type: string }[]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
          <Link href="/home" style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>Home</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <Link href={`/${uniSlug}`} style={{ fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none' }}>{universityName}</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{subjectName}</span>
        </div>

        {/* Hero Banner */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 'clamp(18px, 4vw, 32px) clamp(18px, 4vw, 34px)', marginBottom: 32, background: 'linear-gradient(120deg,rgb(232,240,255) 0%,rgb(239,244,255) 46%,rgb(250,251,255) 100%)', border: '1px solid rgb(223,232,251)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, height: 160, background: 'radial-gradient(rgba(249,168,212,0.3) 0%,rgba(216,180,254,0.15) 55%,transparent 75%)', pointerEvents: 'none', borderRadius: '50%', filter: 'blur(24px)', zIndex: 0 }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap-reverse' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 999, background: 'rgb(239,244,255)', border: '1px solid rgb(213,226,255)', color: '#2F6BFF' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE0A8' }} />{typeBadge}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 999, background: 'rgb(255,246,224)', border: '1px solid rgb(243,225,174)', color: '#A1730A' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.5 5.5 21 7.5 13.5 2 9 9 9"/></svg>
                  {accessBadge}
                </span>
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 800, letterSpacing: '-0.035em', color: '#15203A' }}>{subjectName}</h1>
              {subjectDescription && (
                <p style={{ margin: '0 0 22px', fontSize: 14.5, lineHeight: 1.55, color: 'rgba(27,35,53,0.65)', maxWidth: 680 }}>{subjectDescription}</p>
              )}
              <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(47,107,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#15203A' }}>{totalLectures}</span>
                  <span style={{ fontSize: 13, color: 'rgba(27,35,53,0.55)' }}>Lecture{totalLectures !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(47,107,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#15203A' }}>{groupsData.length}</span>
                  <span style={{ fontSize: 13, color: 'rgba(27,35,53,0.55)' }}>{isSystem ? 'Sub-Subject' : 'Chapter'}{groupsData.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(47,107,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#15203A' }}>{progressPercent}%</span>
                  <span style={{ fontSize: 13, color: 'rgba(27,35,53,0.55)' }}>Complete</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex" style={{ flexShrink: 0, flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="62" cy="62" r="54" fill="none" stroke="rgba(47,107,255,0.18)" strokeWidth="10"/>
                  <circle cx="62" cy="62" r="54" fill="none" stroke="#2F6BFF" strokeWidth="10" strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset={339.3 * (1 - progressPercent / 100)}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#2F6BFF', letterSpacing: '-0.03em' }}>{progressPercent}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(27,35,53,0.55)', fontWeight: 600 }}>{completedCount}/{totalLectures}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 28, alignItems: 'start' }}>

          {/* LEFT: Chapters */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                {isSystem ? 'Sub-Subjects' : 'Chapters'}
              </h2>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>{groupsData.length} {isSystem ? 'sub-subjects' : 'chapters'} · {totalLectures} lectures</span>
            </div>
            <ChapterAccordion groups={groupsData} uniSlug={uniSlug} subjectSlug={subjectSlug} />
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4 }}>MORE IN THIS SUBJECT</div>

            {videoList.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(47,107,255,0.11)', color: 'var(--primary)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>Video Lectures</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{videoList.length} video{videoList.length !== 1 ? 's' : ''}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{videoList.length}</span>
                </div>
                {videoList.slice(0, 2).map(v => (
                  <div key={v.id}>
                    <div style={{ height: 1, background: 'var(--line)', margin: '0 18px' }} />
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  </div>
                ))}
              </div>
            )}

            <Link href={`/${uniSlug}/${subjectSlug}/previous-years`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(110,107,216,0.11)', color: 'var(--violet)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Previous Years</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Past papers &amp; MCQ bank</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            <Link href={`/${uniSlug}/${subjectSlug}/quiz-bank`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,163,74,0.11)', color: 'var(--success)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Quiz Bank</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>All quiz questions in one place</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            <Link href={`/${uniSlug}/${subjectSlug}/flashcards-bank`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(234,179,8,0.11)', color: '#A1730A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Flashcards Bank</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>All flashcards in one place</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </Link>

            {clinicalList.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(19,138,90,0.11)', color: 'var(--success)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><path d="M16 11V3"/><path d="M8 2v3a4 4 0 0 0 8 0V2"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>OSCE &amp; Oral</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Clinical examination</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>{clinicalList.length}</span>
                </div>
                {clinicalList.map(mod => (
                  <div key={mod.id}>
                    <div style={{ height: 1, background: 'var(--line)', margin: '0 18px' }} />
                    <Link href={`/${uniSlug}/${subjectSlug}/clinical/${mod.id}`} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{moduleLabels[mod.module_type] ?? mod.module_type}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}