import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const STUDENT_ONLY_ROUTES = [
  '/home',
  '/bookmarks',
  '/notifications',
  '/profile',
  '/search',
  '/subscriptions',
]

const AUTH_ONLY_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user: authUser } = await updateSession(request)

  

  if (authUser && AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
    const role = await getUserRole(request, authUser.id)
    return NextResponse.redirect(new URL(getRoleRedirect(role), request.url))
  }

  if (pathname.startsWith('/owner')) {
    if (!authUser) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    const role = await getUserRole(request, authUser.id)
    if (role !== 'owner') {
      return NextResponse.redirect(new URL(getRoleRedirect(role), request.url))
    }
    return supabaseResponse
  }

  if (pathname.startsWith('/admin')) {
    if (!authUser) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    const role = await getUserRole(request, authUser.id)
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.redirect(new URL(getRoleRedirect(role), request.url))
    }
    return supabaseResponse
  }

  if (STUDENT_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
    if (!authUser) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  return supabaseResponse
}

async function getUserRole(
  request: NextRequest,
  authUserId: string
): Promise<'owner' | 'admin' | 'student'> {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  return '/home'
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}