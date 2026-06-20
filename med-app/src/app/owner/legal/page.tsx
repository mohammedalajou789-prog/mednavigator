'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DOCUMENTS = [
  {
    key: 'terms_of_service',
    label: 'Terms of Service',
    description: 'Legal terms that users must agree to when using the platform.',
  },
  {
    key: 'privacy_policy',
    label: 'Privacy Policy',
    description: 'How the platform collects, uses, and protects user data.',
  },
  {
    key: 'copyright_notice',
    label: 'Copyright Notice',
    description: 'Ownership declaration for all educational content on the platform.',
  },
  {
    key: 'ip_agreement',
    label: 'Intellectual Property Agreement',
    description: 'Agreement shown to users during registration. Must be accepted to create an account.',
  },
]

export default function LegalCenterPage() {
  const [activeDoc, setActiveDoc] = useState(DOCUMENTS[0].key)
  const [values, setValues] = useState<Record<string, string>>({
    terms_of_service: '',
    privacy_policy: '',
    copyright_notice: '',
    ip_agreement: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('platform_settings')
        .select('id, terms_of_service, privacy_policy')
        .single()

      if (data) {
        setSettingsId(data.id)
        setValues({
          terms_of_service: data.terms_of_service || '',
          privacy_policy: data.privacy_policy || '',
          copyright_notice: '',
          ip_agreement: '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(key: string) {
    if (!settingsId) return
    setSaving(true)

    const updatePayload: Record<string, string> = {}

    if (key === 'terms_of_service') {
      updatePayload.terms_of_service = values.terms_of_service
    } else if (key === 'privacy_policy') {
      updatePayload.privacy_policy = values.privacy_policy
    }

    const { error } = await supabase
      .from('platform_settings')
      .update(updatePayload)
      .eq('id', settingsId)

    setSaving(false)
    if (!error) {
      setSavedKey(key)
      setTimeout(() => setSavedKey(null), 3000)
    }
  }

  const activeDocument = DOCUMENTS.find(d => d.key === activeDoc)!

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Legal Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the legal documents shown to users across the platform.
        </p>
      </div>

      <div className="flex gap-6">

        <div className="w-64 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {DOCUMENTS.map((doc) => (
              <button
                key={doc.key}
                onClick={() => setActiveDoc(doc.key)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                  activeDoc === doc.key
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">{doc.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-700 mb-1">Important</div>
            <div className="text-xs text-amber-600">
              The Intellectual Property Agreement is shown to every user during registration.
              It must be accepted before an account can be created.
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6">

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{activeDocument.label}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{activeDocument.description}</p>
            </div>

            {(activeDoc === 'copyright_notice' || activeDoc === 'ip_agreement') && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                This document will be linked to the database in a future update.
              </div>
            )}

            <textarea
              className="w-full h-96 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Write the ${activeDocument.label} here...`}
              value={values[activeDoc]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [activeDoc]: e.target.value }))
              }
            />

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-400">
                {values[activeDoc].length} characters
              </div>
              <div className="flex items-center gap-3">
                {savedKey === activeDoc && (
                  <span className="text-sm text-green-600 font-medium">✓ Saved successfully</span>
                )}
                <button
                  onClick={() => handleSave(activeDoc)}
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}