import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/services/user'
import StudentLayout from '@/components/student/StudentLayout'

interface University {
  id: string
  name: string
  slug: string | null
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  const authUser = await getAuthUser()
  const profile = authUser ? await getUserProfile() : null

  // Use rpc or raw query to bypass TypeScript type restrictions on slug column
  const { data: universitiesRaw } = await supabase
    .from('universities')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const universities: University[] = (universitiesRaw ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    slug: u.slug ?? null,
  }))

  const myUni = profile
    ? universities.find((u) => u.id === profile.default_university_id)
    : null
  const myUniSlug = myUni?.slug ?? null

  return (
    <StudentLayout
      universities={universities}
      myUniSlug={myUniSlug}
    >
      {children}
    </StudentLayout>
  )
}