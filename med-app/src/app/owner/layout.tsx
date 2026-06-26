import { requireAuth } from '@/lib/services/user'
import { redirect } from 'next/navigation'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import OwnerTopBar from '@/components/owner/OwnerTopBar'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAuth()

  if (profile.role !== 'owner') redirect('/home')

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex">
      <OwnerSidebar fullName={profile.full_name ?? 'Owner'} />
      <div className="flex-1 ml-64 min-w-0 flex flex-col">
        <OwnerTopBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}