import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ universityId: string; subjectId: string }>
}

export default async function SubjectPage({ params }: PageProps) {
  const { universityId, subjectId } = await params
  const supabase = await createServerClient()

  const { data: university } = await supabase
    .from('universities')
    .select('id, name')
    .eq('id', universityId)
    .single()

  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .eq('is_published', true)
    .single()

  if (!subject || !university) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const { data: subSubjects } = await supabase
    .from('sub_subjects')
    .select('id, title, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const { data: lectures } = await supabase
    .from('lectures')
    .select('id, title, chapter_id, sub_subject_id, is_preview')
    .eq('subject_id', subjectId)
    .eq('status', 'published')
    .order('display_order')

  const isSystem = subject.subject_type === 'system'
  const groups = isSystem ? subSubjects ?? [] : chapters ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
        <Link href="/" className="hover:text-[#2563EB]">Home</Link>
        <span>/</span>
        <Link href={`/${universityId}`} className="hover:text-[#2563EB]">{university.name}</Link>
        <span>/</span>
        <span className="text-[#0F172A] font-medium">{subject.name}</span>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            subject.subject_type === 'standard' ? 'bg-blue-100 text-blue-700' :
            subject.subject_type === 'system' ? 'bg-purple-100 text-purple-700' :
            'bg-green-100 text-green-700'
          }`}>
            {subject.subject_type}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            subject.access_mode === 'free' ? 'bg-green-100 text-green-700' :
            subject.access_mode === 'mixed' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {subject.access_mode === 'free' ? 'Free' : subject.access_mode === 'mixed' ? 'Mixed' : 'Premium'}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">{subject.name}</h1>
        {subject.description && <p className="text-[#64748B] mt-2">{subject.description}</p>}
        <p className="text-sm text-[#64748B] mt-2">{lectures?.length ?? 0} Lectures · {groups.length} {isSystem ? 'Sub-Subjects' : 'Chapters'}</p>
      </div>

      <div className="space-y-4">
        {groups.map(group => {
          const groupLectures = lectures?.filter(l =>
            isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id
          ) ?? []

          return (
            <div key={group.id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h2 className="font-semibold text-[#0F172A]">{group.title}</h2>
                <p className="text-sm text-[#64748B]">{groupLectures.length} lectures</p>
              </div>
              <div className="divide-y divide-[#E2E8F0]">
                {groupLectures.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-[#64748B]">No lectures yet.</div>
                ) : (
                  groupLectures.map(lecture => (
                    <Link
                      key={lecture.id}
                      href={`/${universityId}/${subjectId}/${lecture.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📖</div>
                        <span className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{lecture.title}</span>
                        {lecture.is_preview && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Preview</span>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="text-center py-20 text-[#64748B]">
            <p>No content available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}