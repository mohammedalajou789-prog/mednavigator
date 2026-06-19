'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import MNRenderer from '@/components/student/MNRenderer'

interface Chapter { id: string; title: string; display_order: number }
interface Lecture { id: string; title: string; status: string; chapter_id: string | null; sub_subject_id: string | null }

interface ContentBuilderProps {
  subject: Record<string, unknown>
  universityName: string
  chapters: Chapter[]
  subSubjects: Chapter[]
  lectures: Lecture[]
  isSystem: boolean
  userId: string
}

type ContentTab = 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'

export default function ContentBuilder({
  subject,
  universityName,
  chapters,
  subSubjects,
  lectures,
  isSystem,
  userId,
}: ContentBuilderProps) {
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [activeTab, setActiveTab] = useState<ContentTab>('sheet')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const supabase = createBrowserClient()
  const groups = isSystem ? subSubjects : chapters

  async function loadContent(lecture: Lecture, tab: ContentTab) {
    setSelectedLecture(lecture)
    setActiveTab(tab)
    setContent('')
    setTitle('')
    setSaveMsg('')

    if (tab === 'sheet') {
      const { data } = await supabase.from('sheets').select('*').eq('lecture_id', lecture.id).maybeSingle()
      if (data) { setContent(data.content ?? ''); setTitle(data.title ?? ''); setStatus(data.status as 'draft' | 'published') }
      else { setTitle(lecture.title); setStatus('draft') }
    }
    if (tab === 'summary') {
      const { data } = await supabase.from('summaries').select('*').eq('lecture_id', lecture.id).maybeSingle()
      if (data) { setContent(data.content ?? ''); setTitle(data.title ?? ''); setStatus(data.status as 'draft' | 'published') }
      else { setTitle(lecture.title + ' — Summary'); setStatus('draft') }
    }
  }

  async function handleSave(newStatus: 'draft' | 'published') {
    if (!selectedLecture) return
    setSaving(true)
    setSaveMsg('')

    const payload = {
      lecture_id: selectedLecture.id,
      title,
      content,
      status: newStatus,
      updated_by: userId,
    }

    if (activeTab === 'sheet') {
      const { data: existing } = await supabase.from('sheets').select('id').eq('lecture_id', selectedLecture.id).maybeSingle()
      if (existing) {
        await supabase.from('sheets').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('sheets').insert({ ...payload, version: 1, created_by: userId })
      }
    }

    if (activeTab === 'summary') {
      const { data: existing } = await supabase.from('summaries').select('id').eq('lecture_id', selectedLecture.id).maybeSingle()
      if (existing) {
        await supabase.from('summaries').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('summaries').insert({ ...payload, version: 1, created_by: userId })
      }
    }

    setStatus(newStatus)
    setSaving(false)
    setSaveMsg(newStatus === 'published' ? '✅ Published!' : '✅ Saved as draft')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const QUICK_INSERTS = [
    { label: '⚠ Important', value: '\n[IMPORTANT]\n\n[/IMPORTANT]\n' },
    { label: '💎 Clinical Pearl', value: '\n[CLINICAL_PEARL]\n\n[/CLINICAL_PEARL]\n' },
    { label: '⭐ Must Memorize', value: '\n[MUST_MEMORIZE]\n\n[/MUST_MEMORIZE]\n' },
    { label: '📅 Previous Year', value: '\n[PREVIOUS_YEAR]\n\n[/PREVIOUS_YEAR]\n' },
    { label: '🟡 Highlight', value: '\n[HIGHLIGHT]\n\n[/HIGHLIGHT]\n' },
    { label: '📊 Table', value: '\n[TABLE]\n| Column 1 | Column 2 |\n|----------|----------|\n| Value 1  | Value 2  |\n[/TABLE]\n' },
  ]

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Left: Content Tree */}
      <div className="w-64 bg-[#1E293B] text-white overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Subject</p>
          <p className="font-semibold text-white">{String(subject.name)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{universityName}</p>
        </div>

        <div className="p-2">
          {groups.map(group => {
            const groupLectures = lectures.filter(l =>
              isSystem ? l.sub_subject_id === group.id : l.chapter_id === group.id
            )
            return (
              <div key={group.id} className="mb-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1.5">{group.title}</p>
                {groupLectures.map(lecture => (
                  <button
                    key={lecture.id}
                    onClick={() => loadContent(lecture, activeTab)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                      selectedLecture?.id === lecture.id
                        ? 'bg-[#2563EB] text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{lecture.title}</span>
                      <span className={`text-xs ml-1 flex-shrink-0 ${
                        lecture.status === 'published' ? 'text-green-400' : 'text-amber-400'
                      }`}>●</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Center: Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedLecture ? (
          <div className="flex-1 flex items-center justify-center text-[#64748B]">
            <div className="text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="font-medium">Select a lecture to start editing</p>
            </div>
          </div>
        ) : (
          <>
            {/* Editor Top Bar */}
            <div className="bg-white border-b border-[#E2E8F0] px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex gap-1">
                {(['sheet', 'summary'] as ContentTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => loadContent(selectedLecture, tab)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {tab === 'sheet' ? '📄 Sheet' : '📝 Summary'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>{status}</span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                >
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Publish'}
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="bg-white border-b border-[#E2E8F0] px-4 py-2">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title..."
                className="w-full text-lg font-semibold text-[#0F172A] outline-none placeholder:text-[#64748B]"
              />
            </div>

            {/* Quick Insert */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2 flex gap-2 overflow-x-auto">
              {QUICK_INSERTS.map(btn => (
                <button
                  key={btn.label}
                  onClick={() => setContent(prev => prev + btn.value)}
                  className="text-xs px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors whitespace-nowrap"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Editor + Preview */}
            <div className={`flex-1 flex min-h-0 ${showPreview ? 'divide-x divide-[#E2E8F0]' : ''}`}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Start writing MN Syntax here...

# Main Heading
## Sub Heading

[IMPORTANT]
Your important note here
[/IMPORTANT]

[CLINICAL_PEARL]
Your clinical pearl here
[/CLINICAL_PEARL]"
                className="flex-1 p-4 font-mono text-sm text-[#0F172A] outline-none resize-none bg-white"
                style={{ minWidth: showPreview ? '50%' : '100%', maxWidth: showPreview ? '50%' : '100%' }}
              />
              {showPreview && (
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                  <MNRenderer content={content} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}