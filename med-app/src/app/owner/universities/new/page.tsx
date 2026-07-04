'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { notifyNewUniversity } from '@/lib/services/notifications'

export default function NewUniversityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ name: '', country: '', description: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError(null)
  }

  async function uploadLogo(supabase: any, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('logos').upload(filename, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('logos').getPublicUrl(filename)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('University name is required.'); return }
    setError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      let logo_url: string | null = null
      if (logoFile) {
        logo_url = await uploadLogo(supabase, logoFile)
        if (!logo_url) { setError('Failed to upload logo. Please try again.'); return }
      }

      // Generate slug from name
      const slug = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const { error: insertError } = await supabase
        .from('universities')
        .insert({
          name: form.name.trim(),
          country: form.country.trim() || null,
          description: form.description.trim() || null,
          is_active: true,
          logo_url,
          slug,
        } as any)
      if (insertError) { setError('Failed to create university. Please try again.'); return }

      // Notify all users of new university
      await notifyNewUniversity({ universityName: form.name.trim() })
      router.push('/owner/universities')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const initials = form.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U'

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/owner/universities" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1">
          ← Back to Universities
        </Link>
        <h1 className="text-2xl font-semibold text-[#0F172A] mt-2">Add University</h1>
        <p className="text-[#64748B] mt-1">Create a new university on the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-3">University Logo</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-[#E2E8F0] flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden flex-shrink-0"
                style={{ background: '#F8FAFC' }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">
                      {initials}
                    </div>
                    <p className="text-[10px] text-[#94A3B8]">Click to upload</p>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className="text-xs text-[#94A3B8] mt-1.5">PNG, JPG or SVG — max 2MB</p>
                {logoFile && <p className="text-xs text-green-600 mt-0.5">{logoFile.name}</p>}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              University Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Hashemite University"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {form.name && (
              <p className="text-xs text-[#94A3B8] mt-1">
                URL: /{form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Country</label>
            <input
              type="text" name="country" value={form.country} onChange={handleChange}
              placeholder="e.g. Jordan"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Optional description..." rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create University'}
            </button>
            <Link href="/owner/universities" className="px-5 py-2.5 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}