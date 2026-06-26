import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminsPage() {
  const supabase = await createClient()

  const [{ data: admins }, { data: assignments }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, phone, status, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false }),
    supabase
      .from('admin_assignments')
      .select('user_id, subjects(name), universities(name)')
      .eq('is_active', true),
  ])

  const activeCount = admins?.filter((a) => a.status === 'active').length ?? 0

  function getAdminAssignments(adminId: string) {
    return assignments?.filter((a) => a.user_id === adminId) ?? []
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Admins</h1>
          <p className="text-[#64748B] mt-1">Manage admin accounts and subject assignments</p>
        </div>
        <Link
          href="/owner/admins/new"
          className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Admin
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Total Admins</p>
          <p className="text-3xl font-semibold text-[#0F172A] mt-1">{admins?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Active</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Total Assignments</p>
          <p className="text-3xl font-semibold text-[#2563EB] mt-1">{assignments?.length ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#0F172A]">All Admins</h2>
        </div>
        {!admins || admins.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#64748B] text-sm">
            No admins yet. Add your first admin.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Assignments</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {admins.map((admin) => {
                const adminAssignments = getAdminAssignments(admin.id)
                return (
                  <tr key={admin.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 text-xs font-bold">
                            {admin.full_name?.slice(0, 2).toUpperCase() ?? 'AD'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A] text-sm">{admin.full_name ?? '—'}</p>
                          <p className="text-xs text-[#64748B]">{admin.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {adminAssignments.length === 0 ? (
                        <span className="text-sm text-[#64748B]">No assignments</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {adminAssignments.slice(0, 2).map((a, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {(a.subjects as { name: string } | null)?.name ?? '—'}
                            </span>
                          ))}
                          {adminAssignments.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                              +{adminAssignments.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.status === 'active'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : admin.status === 'disabled'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {admin.status ?? 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/owner/admins/${admin.id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}