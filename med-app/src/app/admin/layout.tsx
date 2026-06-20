import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1E293B] text-white flex flex-col fixed inset-y-0 left-0 z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-white">MedNavigator</span>
          <span className="ml-2 text-xs text-blue-400 font-medium">Admin</span>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-medium text-white truncate">{profile.full_name ?? 'Admin'}</p>
          <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/subjects" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            My Subjects
          </Link>
          <Link href="/admin/subscribers" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            Subscribers
          </Link>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {profile.role === 'owner' && (
            <Link href="/owner" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-white/10 transition-colors">
              ← Owner Dashboard
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/10 transition-colors">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56">
        {children}
      </main>
    </div>
  )
}