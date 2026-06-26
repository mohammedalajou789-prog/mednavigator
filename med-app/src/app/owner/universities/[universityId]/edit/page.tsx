'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EditUniversityPage() {
  const router = useRouter()
  const params = useParams()
  const universityId = params.universityId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '', country: '', description: '', is_active: true, logo_url: '',
  })

  useEffect(() => {
    async function loadUniversity() {
      const supabase = createClient()
      const { data } = await supabase
        .from('universities')
        .select('name, country, description, is_active, logo_url')
        .eq('id', universityId)
        .single()
      if (data) {
        setForm({
          name: data.name ?? '',
          country: data.country ?? '',
          description: data.description ?? '',
          is_active: data.is_active ?? true,
          logo_url: data.logo_url ?? '',
        })
        if (data.logo_url) setLogoPreview(data.logo_url)
      }
      setIsLoading(false)
    }
    loadUniversity()
  }, [universityId])

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
    const filename = `${universityId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('logos').upload(filename, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('logos').getPublicUrl(filename)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('University name is required.'); return }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      let logo_url = form.logo_url || null
      if (logoFile) {
        const uploaded = await uploadLogo(supabase, logoFile)
        if (!uploaded) { setError('Failed to upload logo.'); return }
        logo_url = uploaded
      }
      const { error: updateError } = await supabase
        .from('universities')
        .update({
          name: form.name.trim(),
          country: form.country.trim() || null,
          description: form.description.trim() || null,
          logo_url,
        })
        .eq('id', universityId)
      if (updateError) { setError('Failed to update university.'); return }
      setSuccess('University updated successfully.')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleArchive() {
    setIsArchiving(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('universities')
        .update({ is_active: !form.is_active, archived_at: form.is_active ? new Date().toISOString() : null })
        .eq('id', universityId)
      if (updateError) { setError('Failed to update status.'); return }
      setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
      setSuccess(form.is_active ? 'University archived.' : 'University restored.')
    } finally {
      setIsArchiving(false)
    }
  }

  const initials = form.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U'

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/owner/universities" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 inline-flex items-center gap-1">
          ← Back to Universities
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F172A]">Edit University</h1>
            <p className="text-[#64748B] mt-1">{form.name}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${form.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
            {form.is_active ? 'Active' : 'Archived'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mb-4">
        {error && <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-700">{error}</p></div>}
        {success && <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200"><p className="text-sm text-green-700">{success}</p></div>}
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
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">{initials}</div>
                    <p className="text-[10px] text-[#94A3B8]">Click to upload</p>
                  </div>
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className="text-xs text-[#94A3B8] mt-1.5">PNG, JPG or SVG — max 2MB</p>
                {logoFile && <p className="text-xs text-green-600 mt-0.5">{logoFile.name}</p>}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">University Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Country</label>
            <input type="text" name="country" value={form.country} onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/owner/universities" className="px-5 py-2.5 text-sm font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h2 className="font-semibold text-[#0F172A] mb-1">{form.is_active ? 'Archive University' : 'Restore University'}</h2>
        <p className="text-sm text-[#64748B] mb-4">
          {form.is_active ? 'Archiving will hide this university from students. Content is preserved.' : 'Restoring will make this university visible to students again.'}
        </p>
        <button onClick={handleToggleArchive} disabled={isArchiving}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${form.is_active ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
          {isArchiving ? 'Processing...' : form.is_active ? 'Archive University' : 'Restore University'}
        </button>
      </div>
    </div>
  )
}