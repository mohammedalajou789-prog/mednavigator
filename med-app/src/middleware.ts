import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const PUBLIC_ROUTES = ['/', '/login', '/register']

  const { supabaseResponse, user: authUser } = await updateSession(request)

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (authUser && (pathname === '/login' || pathname === '/register')) {
      const role = await getUserRole(request, authUser.id)
      return NextResponse.redirect(new URL(getRoleRedirect(role), request.url))
    }
    return supabaseResponse
  }

  if (!authUser) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = await getUserRole(request, authUser.id)

  if (pathname.startsWith('/owner') && role !== 'owner') {
    return NextResponse.redirect(new URL(getRoleRedirect(role), request.url))
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(getRoleRedirect(role), request.url))
  }

  return supabaseResponse
}

async function getUserRole(request: NextRequest, authUserId: string): Promise<'owner' | 'admin' | 'student'> {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', authUserId)
      .single()
    return (data?.role as 'owner' | 'admin' | 'student') ?? 'student'
  } catch {
    return 'student'
  }
}

function getRoleRedirect(role: string): string {
  if (role === 'owner') return '/owner'
  if (role === 'admin') return '/admin'
  return '/'
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}