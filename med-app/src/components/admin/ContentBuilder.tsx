'use client'

import { useState } from 'react'
import MNRenderer from '@/components/student/MNRenderer'
import { useRouter } from 'next/navigation'

interface ExistingContent {
  id: string
  title: string
  content: string | null
  status: string
  version: number
}

interface Props {
  lectureId: string
  subjectId: string
  lectureTitle: string
  existingSheet: ExistingContent | null
  existingSummary: ExistingContent | null
}

type TabType = 'sheet' | 'summary'

export default function ContentBuilder({
  lectureId,
  subjectId,
  lectureTitle,
  existingSheet,
  existingSummary,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('sheet')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sheet state
  const [sheetTitle, setSheetTitle] = useState(existingSheet?.title ?? lectureTitle + ' — Sheet')
  const [sheetContent, setSheetContent] = useState(existingSheet?.content ?? '')

  // Summary state
  const [summaryTitle, setSummaryTitle] = useState(existingSummary?.title ?? lectureTitle + ' — Summary')
  const [summaryContent, setSummaryContent] = useState(existingSummary?.content ?? '')

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSave = async (status: 'draft' | 'published') => {
    const isPublish = status === 'published'
    if (isPublish) setIsPublishing(true)
    else setIsSaving(true)

    try {
      const isSheet = activeTab === 'sheet'
      const endpoint = isSheet ? '/api/admin/sheets' : '/api/admin/summaries'
      const existingId = isSheet ? existingSheet?.id : existingSummary?.id
      const title = isSheet ? sheetTitle : summaryTitle
      const content = isSheet ? sheetContent : summaryContent

      const res = await fetch(endpoint, {
        method: existingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingId,
          lecture_id: lectureId,
          title,
          content,
          status,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        showMessage('error', result.error ?? 'Failed to save. Please try again.')
        return
      }

      showMessage('success', isPublish ? 'Published successfully!' : 'Draft saved successfully!')
      router.refresh()
    } catch {
      showMessage('error', 'Network error. Please check your connection.')
    } finally {
      setIsSaving(false)
      setIsPublishing(false)
    }
  }

  const activeTitle = activeTab === 'sheet' ? sheetTitle : summaryTitle
  const setActiveTitle = activeTab === 'sheet' ? setSheetTitle : setSummaryTitle
  const activeContent = activeTab === 'sheet' ? sheetContent : summaryContent
  const setActiveContent = activeTab === 'sheet' ? setSheetContent : setSummaryContent
  const existingActive = activeTab === 'sheet' ? existingSheet : existingSummary

  return (
    <div className="grid grid-cols-2 gap-6">

      {/* Left — Editor */}
      <div className="space-y-4">

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            {(['sheet', 'summary'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors capitalize
                  ${activeTab === tab
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {tab}
                {tab === 'sheet' && existingSheet && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    existingSheet.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {existingSheet.status}
                  </span>
                )}
                {tab === 'summary' && existingSummary && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    existingSummary.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {existingSummary.status}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={activeTitle}
                onChange={(e) => setActiveTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* MN Syntax Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">MN Syntax Content</label>
                {existingActive && (
                  <span className="text-xs text-gray-400">Version {existingActive.version}</span>
                )}
              </div>
              <textarea
                value={activeContent}
                onChange={(e) => setActiveContent(e.target.value)}
                rows={24}
                placeholder={`# ${lectureTitle}\n\n## Definition\n\n[IMPORTANT]\nWrite important content here.\n[/IMPORTANT]\n\n## Etiology\n\n[CLINICAL_PEARL]\nWrite clinical pearl here.\n[/CLINICAL_PEARL]`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono
                  text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Quick Insert Buttons */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Quick Insert</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Important', syntax: '\n[IMPORTANT]\n\n[/IMPORTANT]\n' },
                  { label: 'Clinical Pearl', syntax: '\n[CLINICAL_PEARL]\n\n[/CLINICAL_PEARL]\n' },
                  { label: 'Must Memorize', syntax: '\n[MUST_MEMORIZE]\n\n[/MUST_MEMORIZE]\n' },
                  { label: 'Previous Year', syntax: '\n[PREVIOUS_YEAR]\n\n[/PREVIOUS_YEAR]\n' },
                  { label: 'Highlight', syntax: '\n[HIGHLIGHT]\n\n[/HIGHLIGHT]\n' },
                  { label: 'Image Slot', syntax: '\n[IMAGE_SLOT:1]\n' },
                  { label: 'Table', syntax: '\n[TABLE]\n| Column 1 | Column 2 |\n|----------|----------|\n| Value 1  | Value 2  |\n[/TABLE]\n' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveContent(prev => prev + item.syntax)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg
                      hover:bg-gray-200 transition-colors"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving || isPublishing}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
              rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={isSaving || isPublishing || !activeContent.trim()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg
              hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Right — Live Preview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
          <span className="text-xs text-gray-400 capitalize">{activeTab}</span>
        </div>
        <div className="p-5 overflow-y-auto max-h-[700px]">
          {activeContent ? (
            <MNRenderer content={activeContent} showWatermark={false} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">
              Start typing in the editor to see a preview here.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

