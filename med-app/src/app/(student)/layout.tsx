import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/services/user'
import StudentLayout from '@/components/student/StudentLayout'

interface University {
  id: string
  name: string
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  // Get user if logged in — but do NOT redirect guests
  const authUser = await getAuthUser()
  const profile = authUser ? await getUserProfile() : null

  const { data: universitiesRaw } = await supabase
    .from('universities')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  const universities = (universitiesRaw ?? []) as any[]

  const myUni = profile
    ? universities.find((u: any) => u.id === profile.default_university_id)
    : null
  const myUniSlug = myUni?.slug ?? null

  return (
    <StudentLayout
      universities={universities as University[]}
      myUniSlug={myUniSlug}
    >
      {children}
    </StudentLayout>
  )
}