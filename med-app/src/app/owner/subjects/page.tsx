import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SubjectsPage() {
  const supabase = await createClient()

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, subject_type, category, access_mode, is_published, is_active, created_at, universities(id, name)')
    .order('created_at', { ascending: false })

  const publishedCount = subjects?.filter((s) => s.is_published).length ?? 0
  const draftCount = subjects?.filter((s) => !s.is_published && s.is_active).length ?? 0
  const archivedCount = subjects?.filter((s) => !s.is_active).length ?? 0

  function getTypeBadge(type: string) {
    switch (type) {
      case 'standard': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'system': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'clinical': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  function getAccessBadge(mode: string) {
    switch (mode) {
      case 'free': return 'bg-green-50 text-green-700 border-green-200'
      case 'premium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'mixed': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  function getCategoryLabel(category: string | null) {
    switch (category) {
      case 'preclinical': return 'Pre-Clinical'
      case 'clinical_major': return 'Clinical Major'
      case 'clinical_minor': return 'Clinical Minor'
      default: return '—'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Subjects</h1>
          <p className="text-[#64748B] mt-1">Manage all subjects across universities</p>
        </div>
        <Link
          href="/owner/subjects/new"
          className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Subject
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Total Subjects</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1">{subjects?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Published</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Draft</p>
          <p className="text-3xl font-semibold text-amber-600 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Archived</p>
          <p className="text-3xl font-semibold text-[#64748B] mt-1">{archivedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#0F172A]">All Subjects</h2>
        </div>
        {!subjects || subjects.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#64748B] text-sm">
            No subjects yet. Add your first subject.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">University</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Access</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#0F172A] text-sm">{subject.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {(subject.universities as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(subject.subject_type)}`}>
                      {subject.subject_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {getCategoryLabel(subject.category)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAccessBadge(subject.access_mode ?? 'free')}`}>
                      {subject.access_mode ?? 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      !subject.is_active
                        ? 'bg-gray-100 text-gray-500 border-gray-200'
                        : subject.is_published
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {!subject.is_active ? 'Archived' : subject.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/owner/subjects/${subject.id}/edit`}
                      className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}