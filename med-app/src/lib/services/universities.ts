import { createServerClient } from '@/lib/supabase/server'

export async function getAllUniversities() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, logo_url')
    .eq('is_active', true)
    .order('name')
  return { data, error }
}