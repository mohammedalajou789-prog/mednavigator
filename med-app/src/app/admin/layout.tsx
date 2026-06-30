import { requireAuth } from '@/lib/services/user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OwnerTopBar from '@/components/owner/OwnerTopBar'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAuth()

  if (profile.role !== 'admin' && profile.role !== 'owner') {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Sidebar */}
      <AdminSidebar fullName={profile.full_name ?? 'Admin'} role={profile.role} />

      {/* Main content */}
      <div className="flex-1 ml-56 flex flex-col transition-all duration-300">
        <OwnerTopBar />
        <main className="flex-1">
          {children}
        </main>
      </div>

    </div>
  )
}