import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/user'
import StudentLayout from '@/components/student/StudentLayout'

interface University {
  id: string
  name: string
  slug: string | null
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const profile = await requireAuth()

  const { data: universitiesRaw } = await supabase
    .from('universities')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  const universities = (universitiesRaw ?? []) as any[]

  // find the slug of the student's own university
  const myUni = universities.find((u: any) => u.id === profile.default_university_id)
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