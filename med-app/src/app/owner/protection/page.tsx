import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProtectionForm from '@/components/owner/ProtectionForm'

export default async function ProtectionCenterPage() {
  const profile = await requireAuth()

  if (profile.role !== 'owner') redirect('/owner')

  const supabase = await createServerClient()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/owner" className="hover:text-gray-900 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/owner/settings" className="hover:text-gray-900 transition-colors">Settings</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Protection Center</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Protection Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure device lock, watermark, and copy protection settings.
        </p>
      </div>

      <ProtectionForm
        whatsappUrl={settings?.whatsapp_url ?? ''}
        supportEmail={settings?.support_email ?? ''}
      />
    </div>
  )
}