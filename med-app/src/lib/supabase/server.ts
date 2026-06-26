import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — middleware handles session refresh
          }
        },
      },
    }
  )
}

// Alias for compatibility
export const createServerClient = createClient
import { headers } from 'next/headers'

export async function getAuthUserFromHeader(): Promise<{ id: string; email: string } | null> {
  const headersList = await headers()
  const userId = headersList.get('x-auth-user-id')
  const email = headersList.get('x-auth-email') ?? ''
  if (!userId) return null
  return { id: userId, email }
}