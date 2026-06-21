'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MNRenderer from '@/components/student/MNRenderer'

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

interface OSCEManagerProps {
  subjectId: string
  existingModules: ClinicalModule[]
}

const MODULE_LABELS: Record<string, string> = {
  osce: 'OSCE',
  mini_osce: 'Mini-OSCE',
  oral_exam: 'Oral Exam',
}

const MODULE_COLORS: Record<string, string> = {
  osce: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
  mini_osce: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
  oral_exam: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
}

export default function OSCEManager({ subjectId, existingModules }: OSCEManagerProps) {
  const router = useRouter()
  const [modules, setModules] = useState<ClinicalModule[]>(existingModules)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(modules[0]?.id ?? null)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // New module form
  const [newModuleType, setNewModuleType] = useState<string>('osce')

  // New topic form
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [showNewTopicForm, setShowNewTopicForm] = useState(false)

  // Sheet editor
  const [editingSheet, setEditingSheet] = useState<{ topicId: string; sheetId?: string; title: string; content: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const activeModule = modules.find(m => m.id === activeModuleId)
  const activeTopic = activeModule?.clinical_topics.find(t => t.id === activeTopicId)
  const existingTypes = modules.map(m => m.module_type)
  const availableTypes = ['osce', 'mini_osce', 'oral_exam'].filter(t => !existingTypes.includes(t))

  async function handleCreateModule() {
    if (!newModuleType) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_module', subject_id: subjectId, module_type: newModuleType }),
      })
      const data = await res.json()
      if (!res.ok) { showMessage('error', data.error); return }
      const newModule: ClinicalModule = { ...data.data, clinical_topics: [] }
      setModules(prev => [...prev, newModule])
      setActiveModuleId(newModule.id)
      showMessage('success', 'Module created!')
      router.refresh()
    } catch { showMessage('error', 'Network error.') }
    finally { setSaving(false) }
  }

  async function handleCreateTopic() {
    if (!newTopicTitle.trim() || !activeModuleId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_topic', clinical_module_id: activeModuleId, title: newTopicTitle }),
      })
      const data = await res.json()
      if (!res.ok) { showMessage('error', data.error); return }
      const newTopic: ClinicalTopic = { ...data.data, clinical_sheets: [] }
      setModules(prev => prev.map(m =>
        m.id === activeModuleId
          ? { ...m, clinical_topics: [...m.clinical_topics, newTopic] }
          : m
      ))
      setNewTopicTitle('')
      setShowNewTopicForm(false)
      setActiveTopicId(newTopic.id)
      showMessage('success', 'Topic created!')
    } catch { showMessage('error', 'Network error.') }
    finally { setSaving(false) }
  }

  async function handleSaveSheet() {
    if (!editingSheet) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_sheet',
          clinical_topic_id: editingSheet.topicId,
          title: editingSheet.title,
          content: editingSheet.content,
          sheet_id: editingSheet.sheetId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showMessage('error', data.error); return }

      setModules(prev => prev.map(m => ({
        ...m,
        clinical_topics: m.clinical_topics.map(t => {
          if (t.id !== editingSheet.topicId) return t
          const existingIdx = t.clinical_sheets.findIndex(s => s.id === data.data.id)
          if (existingIdx >= 0) {
            const updated = [...t.clinical_sheets]
            updated[existingIdx] = data.data
            return { ...t, clinical_sheets: updated }
          }
          return { ...t, clinical_sheets: [...t.clinical_sheets, data.data] }
        })
      })))

      setEditingSheet(null)
      showMessage('success', 'Content saved!')
    } catch { showMessage('error', 'Network error.') }
    finally { setSaving(false) }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm('Delete this module and all its topics?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_module', module_id: moduleId }),
      })
      if (!res.ok) { showMessage('error', 'Failed to delete module.'); return }
      setModules(prev => prev.filter(m => m.id !== moduleId))
      setActiveModuleId(modules.filter(m => m.id !== moduleId)[0]?.id ?? null)
      showMessage('success', 'Module deleted.')
    } catch { showMessage('error', 'Network error.') }
    finally { setSaving(false) }
  }

  async function handleDeleteTopic(topicId: string) {
    if (!confirm('Delete this topic?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_topic', topic_id: topicId }),
      })
      if (!res.ok) { showMessage('error', 'Failed to delete topic.'); return }
      setModules(prev => prev.map(m => ({
        ...m,
        clinical_topics: m.clinical_topics.filter(t => t.id !== topicId)
      })))
      setActiveTopicId(null)
      showMessage('success', 'Topic deleted.')
    } catch { showMessage('error', 'Network error.') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clinical Examination Modules</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add OSCE, Mini-OSCE, or Oral Exam modules. Maximum 3 modules per subject.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Module Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => { setActiveModuleId(m.id); setActiveTopicId(null); setEditingSheet(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeModuleId === m.id
                ? MODULE_COLORS[m.module_type]
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {MODULE_LABELS[m.module_type] ?? m.module_type}
            <span className="text-xs opacity-70">({m.clinical_topics.length})</span>
          </button>
        ))}

        {/* Add Module */}
        {availableTypes.length > 0 && modules.length < 3 && (
          <div className="flex items-center gap-2">
            <select
              value={newModuleType}
              onChange={e => setNewModuleType(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              {availableTypes.map(t => (
                <option key={t} value={t}>{MODULE_LABELS[t]}</option>
              ))}
            </select>
            <button
              onClick={handleCreateModule}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              + Add Module
            </button>
          </div>
        )}
      </div>

      {/* Module Content */}
      {activeModule ? (
        <div className="grid grid-cols-3 gap-4">

          {/* Topics List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Topics</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Add
                </button>
                <button
                  onClick={() => handleDeleteModule(activeModule.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete Module
                </button>
              </div>
            </div>

            {showNewTopicForm && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  placeholder="Topic title..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                  onKeyDown={e => e.key === 'Enter' && handleCreateTopic()}
                />
                <button
                  onClick={handleCreateTopic}
                  disabled={saving || !newTopicTitle.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}

            {activeModule.clinical_topics.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No topics yet. Add the first topic.
              </div>
            ) : (
              activeModule.clinical_topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => { setActiveTopicId(topic.id); setEditingSheet(null) }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTopicId === topic.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium truncate">{topic.title}</p>
                  <p className="text-xs opacity-60 mt-0.5">{topic.clinical_sheets.length} sheet(s)</p>
                </button>
              ))
            )}
          </div>

          {/* Topic Detail */}
          <div className="col-span-2">
            {activeTopic ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">{activeTopic.title}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingSheet({
                        topicId: activeTopic.id,
                        title: activeTopic.title + ' — Sheet',
                        content: '',
                      })}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      + Add Sheet
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(activeTopic.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete Topic
                    </button>
                  </div>
                </div>

                {/* Sheets */}
                {activeTopic.clinical_sheets.length === 0 && !editingSheet && (
                  <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    No content yet. Click "+ Add Sheet" to add content.
                  </div>
                )}

                {activeTopic.clinical_sheets.map(sheet => (
                  <div key={sheet.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{sheet.title}</p>
                      <button
                        onClick={() => setEditingSheet({
                          topicId: activeTopic.id,
                          sheetId: sheet.id,
                          title: sheet.title,
                          content: sheet.content ?? '',
                        })}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                    {sheet.content && (
                      <div className="p-4 max-h-48 overflow-y-auto">
                        <MNRenderer content={sheet.content} showWatermark={false} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Sheet Editor */}
                {editingSheet && editingSheet.topicId === activeTopic.id && (
                  <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {editingSheet.sheetId ? 'Edit Sheet' : 'New Sheet'}
                    </p>
                    <input
                      type="text"
                      value={editingSheet.title}
                      onChange={e => setEditingSheet(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Sheet title..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <textarea
                        value={editingSheet.content}
                        onChange={e => setEditingSheet(prev => prev ? { ...prev, content: e.target.value } : null)}
                        placeholder="Write MN Syntax content here..."
                        rows={12}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 resize-none"
                        spellCheck={false}
                      />
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 overflow-y-auto max-h-64">
                        <p className="text-xs text-slate-400 mb-2">Live Preview</p>
                        {editingSheet.content ? (
                          <MNRenderer content={editingSheet.content} showWatermark={false} />
                        ) : (
                          <p className="text-xs text-slate-400">Start typing to preview...</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveSheet}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Saving...' : 'Save Sheet'}
                      </button>
                      <button
                        onClick={() => setEditingSheet(null)}
                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                Select a topic from the left to view its content.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          No clinical modules yet. Add a module above to get started.
        </div>
      )}
    </div>
  )
}