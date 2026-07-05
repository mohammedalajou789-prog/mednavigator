import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PreviousYearsBankClient from '@/components/student/PreviousYearsBankClient'

interface PageProps {
  params: Promise<{
    uniSlug: string
    subjectSlug: string
  }>
}

export default async function PreviousYearsBankPage({ params }: PageProps) {
  const { uniSlug, subjectSlug } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    userId = profile?.id ?? null
  }

  // Resolve slugs to IDs
  const [{ data: uniRow }, { data: subRow }] = await Promise.all([
    supabase.from('universities').select('id, name').eq('slug' as any, uniSlug).single(),
    supabase.from('subjects').select('id, name, access_mode').eq('slug' as any, subjectSlug).single(),
  ])

  if (!uniRow || !subRow) redirect('/')

  const universityId = uniRow.id
  const subjectId = subRow.id

  // Check subscription if subject is premium
  let hasAccess = subRow.access_mode === 'free'
  if (!hasAccess && userId) {
    const { data: sub } = await supabase
      .from('subject_subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('subject_id', subjectId)
      .eq('status', 'active')
      .single()
    hasAccess = !!sub
  }

  // Get all chapters for this subject
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  // Get all sub_subjects for this subject
  const { data: subSubjects } = await supabase
    .from('sub_subjects')
    .select('id, title')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  // Get all lectures for this subject
  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, chapter_id, sub_subject_id')
    .eq('subject_id', subjectId)
    .eq('status', 'published')
    .order('display_order')

  if (!lectures || lectures.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-400">No lectures found in this subject.</p>
        <Link href={`/${uniSlug}/${subjectSlug}`} className="text-blue-600 text-sm mt-2 inline-block">
          ← Back to subject
        </Link>
      </div>
    )
  }

  const lectureIds = lectures.map(l => l.id)

  // Get ALL previous year questions from all lectures
  const { data: allQuestions } = await supabase
    .from('previous_year_questions')
    .select('id, lecture_id, question, options, correct_answer, explanation, exam_year, exam_type')
    .in('lecture_id', lectureIds)
    .order('exam_year', { ascending: false })

  const questions = allQuestions ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
        <Link href={`/${uniSlug}`} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          {uniRow.name}
        </Link>
        <span>/</span>
        <Link href={`/${uniSlug}/${subjectSlug}`} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          {subRow.name}
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-200 font-medium">Previous Years Bank</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Previous Years Bank
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {subRow.name} — all previous exam questions in one place
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{questions.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Questions</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {[...new Set(questions.map(q => q.exam_year).filter(Boolean))].length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Exam Years</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {[...new Set(questions.map(q => q.exam_type).filter(Boolean))].length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Exam Types</p>
        </div>
      </div>

      {hasAccess ? (
        <PreviousYearsBankClient
          questions={questions}
          lectures={lectures}
          chapters={chapters ?? []}
          subSubjects={subSubjects ?? []}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Access Required
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Subscribe to {subRow.name} to access the Previous Years Bank.
          </p>
          <Link
            href={`/${uniSlug}/${subjectSlug}`}
            className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Subject Details
          </Link>
        </div>
      )}
    </div>
  )
}
