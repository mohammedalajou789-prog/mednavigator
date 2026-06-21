'use client'

import { useState } from 'react'

interface PersonalNoteProps {
  lectureId: string
  initialNote?: string
  userId?: string
}

export default function PersonalNote({ lectureId, initialNote = '', userId }: PersonalNoteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState(initialNote)
  const [saved, setSaved] = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!userId) return null

  const hasNote = saved.trim().length > 0
  const isDirty = note !== saved

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_id: lectureId, note_content: note }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage('Failed to save note.')
      } else {
        setSaved(note)
        setMessage('Note saved!')
        setTimeout(() => setMessage(null), 2000)
      }
    } catch {
      setMessage('Network error.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setNote(saved)
    setIsOpen(false)
    setMessage(null)
  }

  return (
    <div className="mt-3">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            hasNote
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          {hasNote ? 'View My Note' : 'Add Note'}
          {hasNote && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
          )}
        </button>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              My Note
              <span className="ml-2 text-xs font-normal text-yellow-600 dark:text-yellow-500">
                (private — only you can see this)
              </span>
            </p>
            <button
              onClick={handleCancel}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Write your personal note here..."
            rows={4}
            className="w-full rounded-lg border border-yellow-200 dark:border-yellow-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between">
            <div>
              {message && (
                <span className={`text-xs ${
                  message === 'Note saved!'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {message}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="px-4 py-1.5 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}