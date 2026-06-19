import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LectureHub from '@/components/student/LectureHub'

interface PageProps {
  params: Promise<{ universityId: string; subjectId: string; lectureId: string }>
}

export default async function LecturePage({ params }: PageProps) {
  const { universityId, subjectId, lectureId } = await params
  const supabase = await createServerClient()

  const [
    { data: university },
    { data: subject },
    { data: lecture },
    { data: sheet },
    { data: summary },
    { data: flashcards },
    { data: quizQuestions },
    { data: pyqs },
  ] = await Promise.all([
    supabase.from('universities').select('id, name').eq('id', universityId).single(),
    supabase.from('subjects').select('id, name, subject_type').eq('id', subjectId).single(),
    supabase.from('lectures').select('*').eq('id', lectureId).eq('status', 'published').single(),
    supabase.from('sheets').select('*').eq('lecture_id', lectureId).eq('status', 'published').maybeSingle(),
    supabase.from('summaries').select('*').eq('lecture_id', lectureId).eq('status', 'published').maybeSingle(),
    supabase.from('flashcards').select('*').eq('lecture_id', lectureId).is('archived_at', null).order('display_order'),
    supabase.from('quiz_questions').select('*').eq('lecture_id', lectureId).is('archived_at', null),
    supabase.from('previous_year_questions').select('*').eq('lecture_id', lectureId).is('archived_at', null),
  ])

  if (!lecture || !subject || !university) notFound()

  let groupName = ''
  if (lecture.chapter_id) {
    const { data: ch } = await supabase.from('chapters').select('title').eq('id', lecture.chapter_id).single()
    groupName = ch?.title ?? ''
  } else if (lecture.sub_subject_id) {
    const { data: ss } = await supabase.from('sub_subjects').select('title').eq('id', lecture.sub_subject_id).single()
    groupName = ss?.title ?? ''
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6 flex-wrap">
        <Link href="/" className="hover:text-[#2563EB]">Home</Link>
        <span>/</span>
        <Link href={`/${universityId}`} className="hover:text-[#2563EB]">{university.name}</Link>
        <span>/</span>
        <Link href={`/${universityId}/${subjectId}`} className="hover:text-[#2563EB]">{subject.name}</Link>
        {groupName && <><span>/</span><span>{groupName}</span></>}
        <span>/</span>
        <span className="text-[#0F172A] font-medium">{lecture.title}</span>
      </div>

      <LectureHub
        lecture={lecture}
        sheet={sheet}
        summary={summary}
        flashcards={flashcards ?? []}
        quizQuestions={quizQuestions ?? []}
        previousYears={pyqs ?? []}
      />
    </div>
  )
}