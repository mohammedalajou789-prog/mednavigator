import { createServerClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

export const getAllUniversities = unstable_cache(
  async () => {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, logo_url')
      .eq('is_active', true)
      .order('name')
    return { data, error }
  },
  ['universities-list'],
  {
    revalidate: 3600,
    tags: ['universities'],
  }
)