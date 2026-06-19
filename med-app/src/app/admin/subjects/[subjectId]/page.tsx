import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ subjectId: string }>
}

export default async function AdminSubjectPage({ params }: PageProps) {
  const { subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/')

  const { data: subject } = await supabase
    .from('subjects')
    .select('*, universities(id, name)')
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

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
    .select('id, title, status, chapter_id, sub_subject_id, display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order')

  const isSystem = subject.subject_type === 'system'
  const groups = isSystem ? subSubjects ?? [] : chapters ?? []
  const university = subject.universities as Record<string, unknown> | null

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">MedNavigator</span>
          <span className="text-[#64748B] text-sm">Admin Dashboard</span>
        </div>
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">← Student View</Link>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-[#1E293B] text-white p-4 flex flex-col gap-1">
          {[
            { icon: '🏠', label: 'Dashboard', href: '/admin' },
            { icon: '📚', label: 'My Subjects', href: '/admin/subjects', active: true },
            { icon: '✏️', label: 'Content Builder', href: '/admin/content' },
            { icon: '👥', label: 'Subscribers', href: '/admin/subscribers' },
            { icon: '📊', label: 'Analytics', href: '/admin/analytics' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? 'bg-[#2563EB] text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
            <Link href="/admin" className="hover:text-[#2563EB]">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/subjects" className="hover:text-[#2563EB]">Subjects</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-medium">{subject.name}</span>
          </div>

          {/* Subject Header */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{subject.subject_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${subject.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {subject.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold text-[#0F172A]">{subject.name}</h1>
                <p className="text-[#64748B] text-sm mt-1">{String(university?.name ?? '')}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/subjects/${subjectId}/content`}
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ✏️ Content Builder
                </Link>
              </div>
            </div>
          </div>

          {/* Chapters / Sub-Subjects + Lectures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                {isSystem ? 'Sub-Subjects' : 'Chapters'} & Lectures
              </h2>
              <span className="text-sm text-[#64748B]">{lectures?.length ?? 0} total lectures</span>
            </div>

            {groups.map(group => {
              const groupLectures = lectures?.filter(l =>
                isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id
              ) ?? []

              return (
                <div key={group.id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#0F172A]">{group.title}</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">{groupLectures.length} lectures</p>
                    </div>
                  </div>
                  <div className="divide-y divide-[#E2E8F0]">
                    {groupLectures.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-[#64748B]">No lectures yet.</div>
                    ) : (
                      groupLectures.map(lecture => (
                        <Link
                          key={lecture.id}
                          href={`/admin/subjects/${subjectId}/lectures/${lecture.id}`}
                          className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm">📖</div>
                            <span className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                              {lecture.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              lecture.status === 'published' ? 'bg-green-100 text-green-700' :
                              lecture.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {lecture.status}
                            </span>
                            <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )
            })}

            {groups.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-medium text-[#0F172A]">No content yet</p>
                <p className="text-sm text-[#64748B] mt-1">Start by adding chapters and lectures.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}