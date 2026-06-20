'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface University {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  university_id: string
}

interface NotificationsFormProps {
  universities: University[]
  subjects: Subject[]
}

export default function NotificationsForm({ universities, subjects }: NotificationsFormProps) {
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_type: 'all',
    university_id: '',
    subject_id: '',
    user_email: '',
    priority: 'normal',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const filteredSubjects = subjects.filter(
    (s) => !form.university_id || s.university_id === form.university_id
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.message.trim()) { setError('Message is required.'); return }
    if (form.target_type === 'university' && !form.university_id) {
      setError('Please select a university.'); return
    }
    if (form.target_type === 'subject' && !form.subject_id) {
      setError('Please select a subject.'); return
    }
    setError(null)
    setMessage(null)
    setIsSending(true)
    try {
      const supabase = createClient()

      let userId: string | null = null
      if (form.target_type === 'user' && form.user_email.trim()) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .eq('email', form.user_email.trim())
          .single()
        if (!userRecord) { setError('User not found with that email.'); return }
        userId = userRecord.id
      }

      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          title: form.title.trim(),
          message: form.message.trim(),
          notification_source: 'owner',
          target_type: form.target_type,
          priority: form.priority,
          university_id: form.target_type === 'university' ? form.university_id : null,
          subject_id: form.target_type === 'subject' ? form.subject_id : null,
          user_id: form.target_type === 'user' ? userId : null,
        })

      if (insertError) { setError('Failed to send notification.'); return }

      setMessage('Notification sent successfully.')
      setForm({
        title: '',
        message: '',
        target_type: 'all',
        university_id: '',
        subject_id: '',
        user_email: '',
        priority: 'normal',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
      <h2 className="font-semibold text-[#0F172A] mb-4">Send Notification</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Notification title"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={3}
            placeholder="Notification message..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Priority</label>
          <div className="flex gap-2">
            {['normal', 'important', 'critical'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors capitalize ${
                  form.priority === p
                    ? p === 'critical' ? 'bg-red-600 text-white border-red-600'
                      : p === 'important' ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Send To</label>
          <select
            name="target_type"
            value={form.target_type}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="all">All Users</option>
            <option value="university">Specific University</option>
            <option value="subject">Specific Subject</option>
            <option value="user">Specific User</option>
          </select>
        </div>

        {form.target_type === 'university' && (
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">University</label>
            <select
              name="university_id"
              value={form.university_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="">Select university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {form.target_type === 'subject' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">University (optional filter)</label>
              <select
                name="university_id"
                value={form.university_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">All universities</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Subject</label>
              <select
                name="subject_id"
                value={form.subject_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Select subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {form.target_type === 'user' && (
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">User Email</label>
            <input
              type="email"
              name="user_email"
              value={form.user_email}
              onChange={handleChange}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="w-full py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  )
}