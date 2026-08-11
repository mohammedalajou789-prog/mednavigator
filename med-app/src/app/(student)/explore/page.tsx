import { createClient as createServerClient } from '@/lib/supabase/server'
import ExploreClient from './ExploreClient'

export default async function ExplorePage() {
  const supabase = await createServerClient()

  const [{ data: universitiesRaw }, { data: subjectsRaw }] = await Promise.all([
    supabase
      .from('universities')
      .select('id,name,logo_url,slug,description,country')
      .eq('is_active', true)
      .order('name') as any,
    supabase
      .from('subjects')
      .select('university_id')
      .eq('is_published', true),
  ])

  const unis = (universitiesRaw ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    logo_url: string | null
    description: string | null
    country: string | null
  }>

  const counts: Record<string, number> = {}
  ;(subjectsRaw ?? []).forEach((r: any) => {
    counts[r.university_id] = (counts[r.university_id] ?? 0) + 1
  })

  return <ExploreClient unis={unis} counts={counts} />
}