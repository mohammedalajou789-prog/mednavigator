import { createServerClient } from '@/lib/supabase/server'
import StudentLayout from '@/components/student/StudentLayout'

interface University {
  id: string
  name: string
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <StudentLayout universities={(universities ?? []) as University[]}>
      {children}
    </StudentLayout>
  )
}