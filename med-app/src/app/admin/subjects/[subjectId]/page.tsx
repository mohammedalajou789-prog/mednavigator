import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ subjectId: string }>
}

export default async function AdminSubjectDetailPage({ params }: PageProps) {
  const { subjectId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') redirect('/')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, subject_type, category, access_mode, is_published, university_id, universities(name)')
    .eq('id', subjectId)
    .single()

  if (!subject) redirect('/admin/subjects')

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

  const university = subject.universities as { name: string } | null
  const isSystem = subject.subject_type === 'system'
  const groups = isSystem ? subSubjects : chapters

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-400">MedNavigator</span>
          <span className="text-[#64748B] text-sm">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{profile?.full_name}</span>
          <Link href="/admin" className="text-sm text-blue-400 hover:text-blue-300">← Dashboard</Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-[#1E293B] text-white p-4 flex flex-col gap-1">
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'My Subjects', href: '/admin/subjects' },
            { label: 'Content Builder', href: '/admin/content' },
            { label: 'Subscribers', href: '/admin/subscribers' },
            { label: 'Analytics', href: '/admin/analytics' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-[#64748B] mb-1">{university?.name}</p>
              <h1 className="text-2xl font-semibold text-[#0F172A]">{subject.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {subject.subject_type}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  subject.is_published
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {subject.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/subjects/${subjectId}/chapters/new`}
                className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + {isSystem ? 'Add Sub-Subject' : 'Add Chapter'}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
              <p className="text-xs text-[#64748B]">{isSystem ? 'Sub-Subjects' : 'Chapters'}</p>
              <p className="text-2xl font-semibold text-[#0F172A] mt-1">{groups?.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
              <p className="text-xs text-[#64748B]">Total Lectures</p>
              <p className="text-2xl font-semibold text-[#0F172A] mt-1">{lectures?.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
              <p className="text-xs text-[#64748B]">Published</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">
                {lectures?.filter((l) => l.status === 'published').length ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
              <p className="text-xs text-[#64748B]">Draft</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">
                {lectures?.filter((l) => l.status === 'draft').length ?? 0}
              </p>
            </div>
          </div>

          {/* Chapters / Sub-Subjects with Lectures */}
          <div className="space-y-4">
            {!groups || groups.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[#64748B] text-sm">
                No {isSystem ? 'sub-subjects' : 'chapters'} yet. Add your first one.
              </div>
            ) : (
              groups.map((group) => {
                const groupLectures = lectures?.filter((l) =>
                  isSystem
                    ? l.sub_subject_id === group.id
                    : l.chapter_id === group.id
                ) ?? []

                return (
                  <div key={group.id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                      <h3 className="font-semibold text-[#0F172A] text-sm">{group.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B]">{groupLectures.length} lectures</span>
                        <Link
                          href={`/admin/subjects/${subjectId}/lectures/new?${isSystem ? 'subSubjectId' : 'chapterId'}=${group.id}`}
                          className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          + Add Lecture
                        </Link>
                      </div>
                    </div>
                    {groupLectures.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-[#64748B]">No lectures yet.</div>
                    ) : (
                      <div className="divide-y divide-[#E2E8F0]">
                        {groupLectures.map((lecture) => (
                          <div key={lecture.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                            <p className="text-sm text-[#0F172A]">{lecture.title}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                lecture.status === 'published'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {lecture.status}
                              </span>
                              <Link
                                href={`/admin/subjects/${subjectId}/lectures/${lecture.id}`}
                                className="text-xs px-2.5 py-1 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-gray-50 transition-colors"
                              >
                                Manage
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}