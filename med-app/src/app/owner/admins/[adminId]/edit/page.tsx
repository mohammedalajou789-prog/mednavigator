import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditAdminForm from '@/components/owner/EditAdminForm'

interface Props {
  params: Promise<{ adminId: string }>
}

export default async function EditAdminPage({ params }: Props) {
  const { adminId } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/owner')

  // Load admin user
  const { data: admin } = await supabase
    .from('users')
    .select('id, full_name, email, phone, status, role')
    .eq('id', adminId)
    .single()

  if (!admin || admin.role !== 'admin') notFound()

  // Load current assignments
  const { data: assignments } = await supabase
    .from('admin_assignments')
    .select('id, subject_id, university_id, subjects(name), universities(name)')
    .eq('user_id', adminId)
    .eq('is_active', true)

  // Load all subjects for assignment
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name, university_id, universities(name)')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/owner" className="hover:text-gray-900 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/owner/admins" className="hover:text-gray-900 transition-colors">Admins</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit — {admin.full_name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Admin</h1>
        <p className="text-sm text-gray-500 mt-1">{admin.email}</p>
      </div>

      <EditAdminForm
        admin={{
          id: admin.id,
          full_name: admin.full_name ?? '',
          email: admin.email ?? '',
          phone: admin.phone ?? '',
          status: admin.status ?? 'active',
        }}
        currentAssignments={(assignments ?? []).map(a => ({
          id: a.id,
          subject_id: a.subject_id,
          university_id: a.university_id,
          subject_name: (a.subjects as { name: string } | null)?.name ?? '',
          university_name: (a.universities as { name: string } | null)?.name ?? '',
        }))}
        allSubjects={(allSubjects ?? []).map(s => ({
          id: s.id,
          name: s.name,
          university_id: s.university_id,
          university_name: (s.universities as { name: string } | null)?.name ?? '',
        }))}
      />
    </div>
  )
}