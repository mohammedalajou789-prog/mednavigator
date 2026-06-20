'use client'

import { useState } from 'react'

interface Props {
  whatsappUrl: string
  supportEmail: string
}

export default function ProtectionForm({ whatsappUrl, supportEmail }: Props) {
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    whatsapp_url: whatsappUrl,
    support_email: supportEmail,
  })

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const result = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: result.error ?? 'Failed to save settings.' })
        return
      }

      setMessage({ type: 'success', text: 'Protection settings saved successfully.' })
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Device Lock */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Device Lock System
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-blue-500 text-lg">🔒</span>
            <div>
              <p className="text-sm font-medium text-blue-900">1 Device Per Account</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Each account is locked to the first device that logs in. This is enforced automatically and cannot be disabled.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Support WhatsApp Number
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Students see this number when their device is blocked. They must contact you to request a device reset.
            </p>
            <input
              type="text"
              value={form.whatsapp_url}
              onChange={e => setForm(prev => ({ ...prev, whatsapp_url: e.target.value }))}
              placeholder="e.g. https://wa.me/962791993470"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Support Email
            </label>
            <input
              type="email"
              value={form.support_email}
              onChange={e => setForm(prev => ({ ...prev, support_email: e.target.value }))}
              placeholder="e.g. support@mednavigator.com"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Watermark System
        </h2>
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
          <span className="text-green-500 text-lg">✅</span>
          <div>
            <p className="text-sm font-medium text-green-900">Active — User Name Watermark</p>
            <p className="text-xs text-green-700 mt-0.5">
              Every sheet and summary displays the logged-in student's full name as a diagonal watermark. This is always active and cannot be disabled.
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Watermark Coverage</p>
          <div className="space-y-1.5">
            {['Sheets', 'Summaries', 'Flashcards', 'Quizzes', 'Previous Year Questions'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 text-xs">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copy Protection */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Copy Protection
        </h2>
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
          <span className="text-green-500 text-lg">✅</span>
          <div>
            <p className="text-sm font-medium text-green-900">Active — Browser Protection</p>
            <p className="text-xs text-green-700 mt-0.5">
              Right-click, text selection, and Ctrl+C are disabled on all content pages. Always active.
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700">
            ⚠ Note: These protections are deterrents, not absolute barriers. Determined users may still find ways to copy content. The watermark system is your primary leak-identification tool.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}