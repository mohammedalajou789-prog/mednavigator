'use client'

import { useState, useRef, useCallback } from 'react'
import MNRenderer from '@/components/student/MNRenderer'
import BulkImportTab from '@/components/admin/BulkImportTab'
import VideoManager from '@/components/admin/VideoManager'
import ImageUploader from '@/components/admin/ImageUploader'
import OSCEManager from '@/components/admin/OSCEManager'
import { useRouter } from 'next/navigation'

interface ExistingContent {
  id: string
  title: string
  content: string | null
  status: string
  version: number
}

interface Flashcard {
  id?: string
  front_text: string
  back_text: string
  tags: string[]
}

interface QuizQuestion {
  id?: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_answer: string
  explanation: string
  tags: string[]
}

interface PYQ {
  id?: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  exam_year: number | ''
  exam_type: string
}

interface Video {
  id: string
  title: string
  description: string | null
  video_url: string
  is_preview: boolean
  display_order: number
}

interface ClinicalSheet {
  id: string
  title: string
  content: string | null
}

interface ClinicalTopic {
  id: string
  title: string
  description: string | null
  display_order: number
  clinical_sheets: ClinicalSheet[]
}

interface ClinicalModule {
  id: string
  module_type: string
  clinical_topics: ClinicalTopic[]
}

interface Props {
  lectureId: string
  subjectId: string
  lectureTitle: string
  existingSheet: ExistingContent | null
  existingSummary: ExistingContent | null
  existingFlashcards?: Flashcard[]
  existingQuizQuestions?: QuizQuestion[]
  existingPYQs?: PYQ[]
  existingVideos?: Video[]
  isClinic?: boolean
  existingModules?: ClinicalModule[]
}

type TabType = 'videos' | 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years' | 'osce'
type EditorMode = 'manual' | 'import'

export default function ContentBuilder({
  lectureId,
  subjectId,
  lectureTitle,
  existingSheet,
  existingSummary,
  existingFlashcards = [],
  existingQuizQuestions = [],
  existingPYQs = [],
  existingVideos = [],
  isClinic = false,
  existingModules = [],
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('sheet')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // CHANGE 2 — Student preview mode
  const [studentPreview, setStudentPreview] = useState(false)

  const [flashcardsMode, setFlashcardsMode] = useState<EditorMode>('manual')
  const [quizMode, setQuizMode] = useState<EditorMode>('manual')
  const [pyqMode, setPyqMode] = useState<EditorMode>('manual')

  const [importedFlashcardsCount, setImportedFlashcardsCount] = useState(0)
  const [importedQuizCount, setImportedQuizCount] = useState(0)
  const [importedPyqCount, setImportedPyqCount] = useState(0)

  const [sheetTitle, setSheetTitle] = useState(existingSheet?.title ?? lectureTitle + ' - Sheet')
  const [sheetContent, setSheetContent] = useState(existingSheet?.content ?? '')

  const [summaryTitle, setSummaryTitle] = useState(existingSummary?.title ?? lectureTitle + ' - Summary')
  const [summaryContent, setSummaryContent] = useState(existingSummary?.content ?? '')

  const [flashcards, setFlashcards] = useState<Flashcard[]>(
    existingFlashcards.length > 0 ? existingFlashcards : [{ front_text: '', back_text: '', tags: [] }]
  )

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(
    existingQuizQuestions.length > 0 ? existingQuizQuestions : [{
      question: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
      correct_answer: 'A', explanation: '', tags: []
    }]
  )

  const [pyqs, setPyqs] = useState<PYQ[]>(
    existingPYQs.length > 0 ? existingPYQs : [{
      question: '', options: ['', '', '', '', ''], correct_answer: 'A',
      explanation: '', exam_year: '', exam_type: 'final'
    }]
  )

  // CHANGE 1 — Synchronized scroll refs
  const editorRef  = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)

  const handleEditorScroll = useCallback(() => {
    if (isSyncingRef.current || !editorRef.current || !previewRef.current) return
    isSyncingRef.current = true
    const editor = editorRef.current
    const preview = previewRef.current
    const pct = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
    preview.scrollTop = pct * (preview.scrollHeight - preview.clientHeight)
    requestAnimationFrame(() => { isSyncingRef.current = false })
  }, [])

  const handlePreviewScroll = useCallback(() => {
    if (isSyncingRef.current || !editorRef.current || !previewRef.current) return
    isSyncingRef.current = true
    const editor = editorRef.current
    const preview = previewRef.current
    const pct = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    editor.scrollTop = pct * (editor.scrollHeight - editor.clientHeight)
    requestAnimationFrame(() => { isSyncingRef.current = false })
  }, [])

  // CHANGE 3 — Insert at cursor position
  const insertAtCursor = useCallback((syntax: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    const start  = textarea.selectionStart
    const end    = textarea.selectionEnd
    const isSheet = activeTab === 'sheet'
    const current = isSheet ? sheetContent : summaryContent

    const before = current.slice(0, start)
    const after  = current.slice(end)
    const newContent = before + syntax + after

    if (isSheet) {
      setSheetContent(newContent)
    } else {
      setSummaryContent(newContent)
    }

    // Restore cursor position after the inserted text
    requestAnimationFrame(() => {
      if (!textarea) return
      const newPos = start + syntax.length
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    })
  }, [activeTab, sheetContent, summaryContent])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSaveContent = async (status: 'draft' | 'published') => {
    const isPublish = status === 'published'
    if (isPublish) setIsPublishing(true)
    else setIsSaving(true)

    try {
      const isSheet    = activeTab === 'sheet'
      const endpoint   = isSheet ? '/api/admin/sheets' : '/api/admin/summaries'
      const existingId = isSheet ? existingSheet?.id : existingSummary?.id
      const title      = isSheet ? sheetTitle : summaryTitle
      const content    = isSheet ? sheetContent : summaryContent

      const res = await fetch(endpoint, {
        method: existingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existingId, lecture_id: lectureId, title, content, status: status.trim() }),
      })

      const result = await res.json()
      if (!res.ok) { showMessage('error', result.error ?? 'Failed to save.'); return }
      showMessage('success', isPublish ? 'Published successfully!' : 'Draft saved!')
      router.refresh()
    } catch {
      showMessage('error', 'Network error.')
    } finally {
      setIsSaving(false)
      setIsPublishing(false)
    }
  }

  const handleSaveFlashcards = async () => {
    setIsSaving(true)
    try {
      const valid = flashcards.filter(f => f.front_text.trim() && f.back_text.trim())
      if (valid.length === 0) { showMessage('error', 'Add at least one complete flashcard.'); return }

      const res = await fetch('/api/admin/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_id: lectureId, flashcards: valid }),
      })

      const result = await res.json()
      if (!res.ok) { showMessage('error', result.error ?? 'Failed to save.'); return }
      showMessage('success', `${valid.length} flashcard(s) saved!`)
      router.refresh()
    } catch {
      showMessage('error', 'Network error.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveQuiz = async () => {
    setIsSaving(true)
    try {
      const valid = quizQuestions.filter(q => q.question.trim() && q.option_a.trim() && q.correct_answer.trim())
      if (valid.length === 0) { showMessage('error', 'Add at least one complete question.'); return }

      const res = await fetch('/api/admin/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_id: lectureId, questions: valid }),
      })

      const result = await res.json()
      if (!res.ok) { showMessage('error', result.error ?? 'Failed to save.'); return }
      showMessage('success', `${valid.length} question(s) saved!`)
      router.refresh()
    } catch {
      showMessage('error', 'Network error.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePYQs = async () => {
    setIsSaving(true)
    try {
      const valid = pyqs.filter(q => q.question.trim() && q.correct_answer.trim())
      if (valid.length === 0) { showMessage('error', 'Add at least one complete question.'); return }

      const res = await fetch('/api/admin/previous-year-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecture_id: lectureId, questions: valid }),
      })

      const result = await res.json()
      if (!res.ok) { showMessage('error', result.error ?? 'Failed to save.'); return }
      showMessage('success', `${valid.length} question(s) saved!`)
      router.refresh()
    } catch {
      showMessage('error', 'Network error.')
    } finally {
      setIsSaving(false)
    }
  }

  const TABS: { id: TabType; label: string }[] = [
    { id: 'videos', label: 'Videos' },
    { id: 'sheet', label: 'Sheet' },
    { id: 'summary', label: 'Summary' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'previous_years', label: 'Previous Years' },
    ...(isClinic ? [{ id: 'osce' as TabType, label: 'OSCE' }] : []),
  ]

  function ModeToggle({ mode, setMode }: { mode: EditorMode; setMode: (m: EditorMode) => void }) {
    return (
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit mb-4">
        <button onClick={() => setMode('manual')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'manual' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          Manual
        </button>
        <button onClick={() => setMode('import')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'import' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          Bulk Import
        </button>
      </div>
    )
  }

  function getImageSlots(content: string): number[] {
    const matches = [...content.matchAll(/\[IMAGE_SLOT:(\d+)\]/g)]
    const nums = matches.map(m => parseInt(m[1]))
    return [...new Set(nums)].sort((a, b) => a - b)
  }

  // Syntax buttons config
  const syntaxButtons = [
    { label: 'Important',     syntax: '\n[IMPORTANT]\n\n[/IMPORTANT]\n' },
    { label: 'Clinical Pearl', syntax: '\n[CLINICAL_PEARL]\n\n[/CLINICAL_PEARL]\n' },
    { label: 'Must Memorize', syntax: '\n[MUST_MEMORIZE]\n\n[/MUST_MEMORIZE]\n' },
    { label: 'Previous Year', syntax: '\n[PREVIOUS_YEAR]\n\n[/PREVIOUS_YEAR]\n' },
    { label: 'Highlight',     syntax: '\n[HIGHLIGHT]\n\n[/HIGHLIGHT]\n' },
    { label: 'Image Slot',    syntax: '\n[IMAGE_SLOT:1]\n' },
    { label: 'Table',         syntax: '\n[TABLE]\n| Column 1 | Column 2 |\n|----------|----------|\n| Value 1  | Value 2  |\n[/TABLE]\n' },
  ]

  const currentContent = activeTab === 'sheet' ? sheetContent : summaryContent

  return (
    <div className="space-y-4">

      {/* Tab Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setStudentPreview(false) }}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
              {tab.id === 'videos' && existingVideos.length > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{existingVideos.length}</span>
              )}
              {tab.id === 'sheet' && existingSheet && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${existingSheet.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{existingSheet.status}</span>
              )}
              {tab.id === 'summary' && existingSummary && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${existingSummary.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{existingSummary.status}</span>
              )}
              {tab.id === 'flashcards' && (existingFlashcards.length + importedFlashcardsCount) > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">{existingFlashcards.length + importedFlashcardsCount}</span>
              )}
              {tab.id === 'quiz' && (existingQuizQuestions.length + importedQuizCount) > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{existingQuizQuestions.length + importedQuizCount}</span>
              )}
              {tab.id === 'previous_years' && (existingPYQs.length + importedPyqCount) > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{existingPYQs.length + importedPyqCount}</span>
              )}
              {tab.id === 'osce' && existingModules.length > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{existingModules.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Videos */}
      {activeTab === 'videos' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <VideoManager lectureId={lectureId} subjectId={subjectId} existingVideos={existingVideos} />
        </div>
      )}

      {/* Sheet & Summary */}
      {(activeTab === 'sheet' || activeTab === 'summary') && (
        <>
          {/* CHANGE 2 — Student Preview toggle button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {/* CHANGE 3 — Insert at cursor buttons */}
              {!studentPreview && syntaxButtons.map((item) => (
                <button
                  key={item.label}
                  onClick={() => insertAtCursor(item.syntax)}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStudentPreview(p => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                studentPreview
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {studentPreview ? 'Back to Editor' : 'Student Preview'}
            </button>
          </div>

          {/* CHANGE 2 — Student preview mode: full width, watermark on */}
          {studentPreview ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Student View — exactly as students see it</span>
              </div>
              <div className="p-5 overflow-y-auto max-h-[800px]">
                {currentContent ? (
                  <MNRenderer content={currentContent} showWatermark={true} userName="Preview User" />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No content to preview.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* CHANGE 1 — Synchronized scroll: editor + preview side by side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Editor panel */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={activeTab === 'sheet' ? sheetTitle : summaryTitle}
                        onChange={(e) => activeTab === 'sheet' ? setSheetTitle(e.target.value) : setSummaryTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">MN Syntax Content</label>
                        {(activeTab === 'sheet' ? existingSheet : existingSummary) && (
                          <span className="text-xs text-gray-400">Version {(activeTab === 'sheet' ? existingSheet : existingSummary)?.version}</span>
                        )}
                      </div>
                      {/* CHANGE 1: ref + onScroll for sync */}
                      <textarea
                        ref={editorRef}
                        value={activeTab === 'sheet' ? sheetContent : summaryContent}
                        onChange={(e) => activeTab === 'sheet' ? setSheetContent(e.target.value) : setSummaryContent(e.target.value)}
                        onScroll={handleEditorScroll}
                        rows={24}
                        placeholder={`# ${lectureTitle}\n\n## Definition\n\n[IMPORTANT]\nWrite important content here.\n[/IMPORTANT]`}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {message && (
                    <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                      {message.text}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSaveContent('draft')} disabled={isSaving || isPublishing}
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button onClick={() => handleSaveContent('published')} disabled={isSaving || isPublishing}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                  </div>
                </div>

                {/* Preview panel — CHANGE 1: ref + onScroll for sync */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Preview</h3>
                    <span className="text-xs text-gray-400 capitalize">{activeTab}</span>
                  </div>
                  <div
                    ref={previewRef}
                    onScroll={handlePreviewScroll}
                    className="p-5 overflow-y-auto max-h-[700px]"
                  >
                    {currentContent ? (
                      <MNRenderer content={currentContent} showWatermark={false} />
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-12">Start typing to see preview.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Slots Manager */}
              {(() => {
                const content    = activeTab === 'sheet' ? sheetContent : summaryContent
                const existingId = activeTab === 'sheet' ? existingSheet?.id : existingSummary?.id
                const uniqueSlots = getImageSlots(content)
                if (uniqueSlots.length === 0 || !existingId) return null
                return (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      Image Slots ({uniqueSlots.length} found in content)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {uniqueSlots.map(slot => (
                        <ImageUploader
                          key={slot}
                          entityType={activeTab}
                          entityId={existingId}
                          slotNumber={slot}
                          onUploadSuccess={(url, slotNumber) => {
                            showMessage('success', `Image uploaded for slot ${slotNumber}!`)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <ModeToggle mode={flashcardsMode} setMode={setFlashcardsMode} />
          {flashcardsMode === 'import' ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <BulkImportTab lectureId={lectureId} type="flashcards"
                onImportSuccess={(count) => { setImportedFlashcardsCount(prev => prev + count); showMessage('success', `${count} flashcard(s) imported successfully!`); router.refresh() }} />
            </div>
          ) : (
            <>
              {flashcards.map((card, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Card {index + 1}</span>
                    {flashcards.length > 1 && (
                      <button onClick={() => setFlashcards(prev => prev.filter((_, i) => i !== index))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Front (Question)</label>
                      <textarea rows={4} value={card.front_text}
                        onChange={(e) => setFlashcards(prev => prev.map((c, i) => i === index ? { ...c, front_text: e.target.value } : c))}
                        placeholder="What is the definition of..."
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Back (Answer)</label>
                      <textarea rows={4} value={card.back_text}
                        onChange={(e) => setFlashcards(prev => prev.map((c, i) => i === index ? { ...c, back_text: e.target.value } : c))}
                        placeholder="The answer is..."
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setFlashcards(prev => [...prev, { front_text: '', back_text: '', tags: [] }])}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add Flashcard
              </button>
              {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
              )}
              <button onClick={handleSaveFlashcards} disabled={isSaving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {isSaving ? 'Saving...' : `Save ${flashcards.filter(f => f.front_text && f.back_text).length} Flashcard(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <ModeToggle mode={quizMode} setMode={setQuizMode} />
          {quizMode === 'import' ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <BulkImportTab lectureId={lectureId} type="quiz"
                onImportSuccess={(count) => { setImportedQuizCount(prev => prev + count); showMessage('success', `${count} question(s) imported successfully!`); router.refresh() }} />
            </div>
          ) : (
            <>
              {quizQuestions.map((q, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Question {index + 1}</span>
                    {quizQuestions.length > 1 && (
                      <button onClick={() => setQuizQuestions(prev => prev.filter((_, i) => i !== index))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <textarea rows={3} value={q.question}
                      onChange={(e) => setQuizQuestions(prev => prev.map((item, i) => i === index ? { ...item, question: e.target.value } : item))}
                      placeholder="Write the question here..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                      {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                        const field = `option_${letter.toLowerCase()}` as keyof QuizQuestion
                        return (
                          <div key={letter} className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${q.correct_answer === letter ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{letter}</span>
                            <input type="text" value={q[field] as string}
                              onChange={(e) => setQuizQuestions(prev => prev.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item))}
                              placeholder={`Option ${letter}`}
                              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Correct Answer</label>
                        <select value={q.correct_answer}
                          onChange={(e) => setQuizQuestions(prev => prev.map((item, i) => i === index ? { ...item, correct_answer: e.target.value } : item))}
                          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Explanation</label>
                        <input type="text" value={q.explanation}
                          onChange={(e) => setQuizQuestions(prev => prev.map((item, i) => i === index ? { ...item, explanation: e.target.value } : item))}
                          placeholder="Why is this the correct answer?"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setQuizQuestions(prev => [...prev, { question: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answer: 'A', explanation: '', tags: [] }])}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add Question
              </button>
              {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
              )}
              <button onClick={handleSaveQuiz} disabled={isSaving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {isSaving ? 'Saving...' : `Save ${quizQuestions.filter(q => q.question && q.option_a).length} Question(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Previous Years */}
      {activeTab === 'previous_years' && (
        <div className="space-y-4">
          <ModeToggle mode={pyqMode} setMode={setPyqMode} />
          {pyqMode === 'import' ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <BulkImportTab lectureId={lectureId} type="pyq"
                onImportSuccess={(count) => { setImportedPyqCount(prev => prev + count); showMessage('success', `${count} PYQ(s) imported successfully!`); router.refresh() }} />
            </div>
          ) : (
            <>
              {pyqs.map((q, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Question {index + 1}</span>
                    {pyqs.length > 1 && (
                      <button onClick={() => setPyqs(prev => prev.filter((_, i) => i !== index))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Exam Year</label>
                        <input type="number" value={q.exam_year}
                          onChange={(e) => setPyqs(prev => prev.map((item, i) => i === index ? { ...item, exam_year: e.target.value ? parseInt(e.target.value) : '' } : item))}
                          placeholder="2024"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Exam Type</label>
                        <select value={q.exam_type}
                          onChange={(e) => setPyqs(prev => prev.map((item, i) => i === index ? { ...item, exam_type: e.target.value } : item))}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="final">Final</option>
                          <option value="midterm">Midterm</option>
                          <option value="quiz">Quiz</option>
                          <option value="practical">Practical</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Correct Answer</label>
                        <select value={q.correct_answer}
                          onChange={(e) => setPyqs(prev => prev.map((item, i) => i === index ? { ...item, correct_answer: e.target.value } : item))}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <textarea rows={3} value={q.question}
                      onChange={(e) => setPyqs(prev => prev.map((item, i) => i === index ? { ...item, question: e.target.value } : item))}
                      placeholder="Write the exam question here..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${q.correct_answer === String.fromCharCode(65 + optIndex) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{String.fromCharCode(65 + optIndex)}</span>
                          <input type="text" value={opt}
                            onChange={(e) => setPyqs(prev => prev.map((item, i) => i === index ? { ...item, options: item.options.map((o, oi) => oi === optIndex ? e.target.value : o) } : item))}
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      ))}
                    </div>
                    <input type="text" value={q.explanation}
                      onChange={(e) => setPyqs(prev => prev.map((item, i) => i === index ? { ...item, explanation: e.target.value } : item))}
                      placeholder="Explanation (optional)"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              ))}
              <button onClick={() => setPyqs(prev => [...prev, { question: '', options: ['', '', '', '', ''], correct_answer: 'A', explanation: '', exam_year: '', exam_type: 'final' }])}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Add Question
              </button>
              {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{message.text}</div>
              )}
              <button onClick={handleSavePYQs} disabled={isSaving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {isSaving ? 'Saving...' : `Save ${pyqs.filter(q => q.question).length} Question(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* OSCE */}
      {activeTab === 'osce' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <OSCEManager subjectId={subjectId} existingModules={existingModules} />
        </div>
      )}

    </div>
  )
}