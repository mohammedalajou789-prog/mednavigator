import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OwnerDashboard() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalUniversities },
    { count: totalSubjects },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('universities').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('subject_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const kpis = [
    { label: 'Total Users', value: totalUsers ?? 0, href: '/owner/users' },
    { label: 'Universities', value: totalUniversities ?? 0, href: '/owner/universities' },
    { label: 'Published Subjects', value: totalSubjects ?? 0, href: '/owner/subjects' },
    { label: 'Active Subscriptions', value: activeSubscriptions ?? 0, href: '/owner/subscriptions' },
  ]

  const quickActions = [
    { label: 'Manage Universities', desc: 'Add, edit, or archive universities', href: '/owner/universities' },
    { label: 'Manage Subjects', desc: 'Configure subjects and content access', href: '/owner/subjects' },
    { label: 'Manage Admins', desc: 'Create and assign admin accounts', href: '/owner/admins' },
    { label: 'User Management', desc: 'View users, devices, and bans', href: '/owner/users' },
    { label: 'Subscriptions', desc: 'Grant and manage user subscriptions', href: '/owner/subscriptions' },
    { label: 'Platform Settings', desc: 'Payment, legal, and protection settings', href: '/owner/settings' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Owner Dashboard</h1>
        <p className="text-[#64748B] mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-sm text-[#64748B] mb-1">{kpi.label}</p>
            <p className="text-3xl font-semibold text-[#0F172A]">{kpi.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <h3 className="font-semibold text-[#0F172A] group-hover:text-blue-600 transition-colors mb-1">
              {item.label}
            </h3>
            <p className="text-sm text-[#64748B]">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}