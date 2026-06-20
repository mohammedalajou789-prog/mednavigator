import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function UniversitiesPage() {
  const supabase = await createClient()

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name, country, logo_url, is_active, created_at')
    .order('created_at', { ascending: false })

  const activeCount = universities?.filter((u) => u.is_active).length ?? 0
  const archivedCount = universities?.filter((u) => !u.is_active).length ?? 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Universities</h1>
          <p className="text-[#64748B] mt-1">Manage all universities on the platform</p>
        </div>
        <Link
          href="/owner/universities/new"
          className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add University
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Total Universities</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1">{universities?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Active</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Archived</p>
          <p className="text-3xl font-semibold text-[#64748B] mt-1">{archivedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#0F172A]">All Universities</h2>
        </div>
        {!universities || universities.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#64748B] text-sm">
            No universities yet. Add your first university.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">University</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {universities.map((uni) => (
                <tr key={uni.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        {uni.logo_url ? (
                          <img src={uni.logo_url} alt={uni.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-blue-600 text-xs font-bold">
                            {uni.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-[#0F172A] text-sm">{uni.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{uni.country ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      uni.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {uni.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {new Date(uni.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/owner/universities/${uni.id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/owner/universities/${uni.id}/subjects`}
                        className="px-3 py-1.5 text-xs font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Subjects
                      </Link>
                    </div>
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