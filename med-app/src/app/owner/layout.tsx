import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OwnerSidebar from '@/components/owner/OwnerSidebar'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/home')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <OwnerSidebar fullName={profile?.full_name ?? 'Owner'} />
      <div className="flex-1 ml-64 min-w-0">
        {children}
      </div>
    </div>
  )
}