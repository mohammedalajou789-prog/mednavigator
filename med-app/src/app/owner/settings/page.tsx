'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState({
    platform_name: '',
    support_email: '',
    whatsapp_url: '',
    telegram_url: '',
    terms_of_service: '',
    privacy_policy: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('platform_settings')
        .select('*')
        .single()
      if (data) {
        setSettingsId(data.id)
        setForm({
          platform_name: data.platform_name ?? '',
          support_email: data.support_email ?? '',
          whatsapp_url: data.whatsapp_url ?? '',
          telegram_url: data.telegram_url ?? '',
          terms_of_service: data.terms_of_service ?? '',
          privacy_policy: data.privacy_policy ?? '',
        })
      }
      setIsLoading(false)
    }
    load()
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      const supabase = createClient()
      if (settingsId) {
        const { error: updateError } = await supabase
          .from('platform_settings')
          .update({
            platform_name: form.platform_name,
            support_email: form.support_email || null,
            whatsapp_url: form.whatsapp_url || null,
            telegram_url: form.telegram_url || null,
            terms_of_service: form.terms_of_service || null,
            privacy_policy: form.privacy_policy || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingsId)
        if (updateError) { setError('Failed to save settings.'); return }
      } else {
        const { error: insertError } = await supabase
          .from('platform_settings')
          .insert({
            platform_name: form.platform_name || 'MedNavigator',
            support_email: form.support_email || null,
            whatsapp_url: form.whatsapp_url || null,
            telegram_url: form.telegram_url || null,
            terms_of_service: form.terms_of_service || null,
            privacy_policy: form.privacy_policy || null,
          })
        if (insertError) { setError('Failed to save settings.'); return }
      }
      setMessage('Settings saved successfully.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Platform Settings</h1>
        <p className="text-[#64748B] mt-1">Configure platform information and support contacts</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {message && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        {/* Platform Info */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="font-semibold text-[#0F172A] mb-4">Platform Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Platform Name</label>
              <input
                type="text"
                name="platform_name"
                value={form.platform_name}
                onChange={handleChange}
                placeholder="MedNavigator"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Support Email</label>
              <input
                type="email"
                name="support_email"
                value={form.support_email}
                onChange={handleChange}
                placeholder="support@mednavigator.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contact & Payment */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="font-semibold text-[#0F172A] mb-4">Contact & Payment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="text"
                name="whatsapp_url"
                value={form.whatsapp_url}
                onChange={handleChange}
                placeholder="e.g. 0791993470"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <p className="text-xs text-[#64748B] mt-1">
                Used for payment instructions and device reset support
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Telegram
              </label>
              <input
                type="text"
                name="telegram_url"
                value={form.telegram_url}
                onChange={handleChange}
                placeholder="e.g. @mednavigator"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="font-semibold text-[#0F172A] mb-4">Legal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Terms of Service
              </label>
              <textarea
                name="terms_of_service"
                value={form.terms_of_service}
                onChange={handleChange}
                rows={6}
                placeholder="Enter your terms of service..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Privacy Policy
              </label>
              <textarea
                name="privacy_policy"
                value={form.privacy_policy}
                onChange={handleChange}
                rows={6}
                placeholder="Enter your privacy policy..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}