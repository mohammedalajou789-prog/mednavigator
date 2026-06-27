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

  // user is fetched client-side via useUser() hook
const profile = null

  // Use rpc or raw query to bypass TypeScript type restrictions on slug column
  const { data: universitiesRaw } = await supabase
    .from('universities')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  const universities: University[] = (universitiesRaw ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    slug: u.slug ?? null,
  }))

  const myUniSlug = null

  return (
    <StudentLayout
      universities={universities}
      myUniSlug={myUniSlug}
    >
      {children}
    </StudentLayout>
  )
}