import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UniversityRequestActions from '@/components/owner/UniversityRequestActions'

export default async function UniversityRequestsPage() {
  const profile = await requireAuth()

  if (profile.role !== 'owner') redirect('/owner')

  const supabase = await createServerClient()

  const { data: requests } = await supabase
    .from('university_requests')
    .select(`
      id,
      requested_university_name,
      status,
      created_at,
      reviewed_at,
      users!university_requests_user_id_fkey (
        id,
        full_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  const pending = (requests ?? []).filter(r => r.status === 'pending')
  const reviewed = (requests ?? []).filter(r => r.status !== 'pending')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/owner" className="hover:text-gray-900 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">University Requests</span>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">University Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Students who registered with a university not yet on the platform.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Pending — Requires Action
          </h2>
          <div className="space-y-3">
            {pending.map(request => {
              const student = request.users as { id: string; full_name: string; email: string; phone: string } | null
              return (
                <div key={request.id} className="bg-white border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <h3 className="font-semibold text-gray-900">
                          {request.requested_university_name}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-500 space-y-0.5 ml-4">
                        <p>Requested by: <span className="text-gray-700 font-medium">{student?.full_name}</span></p>
                        <p>Email: <span className="text-gray-700">{student?.email}</span></p>
                        {student?.phone && <p>Phone: <span className="text-gray-700">{student.phone}</span></p>}
                        <p>Date: <span className="text-gray-700">
                          {request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}
                        </span></p>
                      </div>
                    </div>
                    <UniversityRequestActions
                      requestId={request.id}
                      universityName={request.requested_university_name}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center mb-8">
          <p className="text-gray-400 text-sm">No pending university requests.</p>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Previously Reviewed
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">University</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviewed.map(request => {
                  const student = request.users as { full_name: string; email: string } | null
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{request.requested_university_name}</td>
                      <td className="px-5 py-3 text-gray-600">{student?.full_name}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}