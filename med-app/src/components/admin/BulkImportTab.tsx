'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { parseFlashcards, parseQuizQuestions, parsePYQ } from '@/lib/utils/mn-parser'

type ImportType = 'flashcards' | 'quiz' | 'pyq'

interface BulkImportTabProps {
  lectureId: string
  type: ImportType
  onImportSuccess: (count: number) => void
}

const SYNTAX_EXAMPLES: Record<ImportType, string> = {
  flashcards: `[CARD]
Q: What is normal ejection fraction?
A: 55–70%
[/CARD]

[CARD]
Q: What is the most common cause of heart failure?
A: Ischemic heart disease
[/CARD]`,

  quiz: `[QUESTION]
What is the normal ejection fraction?
A) 20–30%
B) 30–40%
C) 55–70%
D) 70–80%
E) >80%
CORRECT: C
EXPLANATION: Normal EF is 55–70%.
[/QUESTION]

[QUESTION]
Which drug improves survival in systolic heart failure?
A) Digoxin
B) ACE inhibitors
C) Calcium channel blockers
D) Aspirin
E) Nitrates
CORRECT: B
EXPLANATION: ACE inhibitors reduce mortality in heart failure with reduced EF.
[/QUESTION]`,

  pyq: `[PYQ]
BATCH: 2027
EXAM_YEAR: 2025
EXAM_TYPE: Final
QUESTION: What is the normal ejection fraction?
A) 20–30%
B) 30–40%
C) 55–70%
D) 70–80%
E) >80%
CORRECT: C
EXPLANATION: Normal EF is 55–70%.
[/PYQ]

[PYQ]
BATCH: 2027
EXAM_YEAR: 2024
EXAM_TYPE: Midterm
QUESTION: What is the first-line treatment for systolic heart failure?
A) Digoxin
B) Furosemide
C) ACE inhibitors
D) Spironolactone
E) Amiodarone
CORRECT: C
EXPLANATION: ACE inhibitors are first-line treatment.
[/PYQ]`,
}

const TYPE_LABELS: Record<ImportType, { tag: string; label: string; block: string }> = {
  flashcards: { tag: '[CARD]...[/CARD]', label: 'Flashcards', block: 'card' },
  quiz: { tag: '[QUESTION]...[/QUESTION]', label: 'Quiz Questions', block: 'question' },
  pyq: { tag: '[PYQ]...[/PYQ]', label: 'Previous Year Questions', block: 'PYQ' },
}

export default function BulkImportTab({ lectureId, type, onImportSuccess }: BulkImportTabProps) {
  const [rawText, setRawText] = useState('')
  const [showExample, setShowExample] = useState(false)
  const [preview, setPreview] = useState<{ count: number; errors: { index: number; message: string }[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; imported?: number; error?: string } | null>(null)

  const info = TYPE_LABELS[type]

  function handlePreview() {
    setResult(null)
    if (!rawText.trim()) { setPreview(null); return }

    let parsed
    if (type === 'flashcards') parsed = parseFlashcards(rawText)
    else if (type === 'quiz') parsed = parseQuizQuestions(rawText)
    else parsed = parsePYQ(rawText)

    setPreview({ count: parsed.items.length, errors: parsed.errors })
  }

  async function handleImport() {
    if (!rawText.trim()) return
    setImporting(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, lecture_id: lectureId, raw_text: rawText }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, error: data.error || 'Import failed' })
      } else {
        setResult({ success: true, imported: data.imported })
        setRawText('')
        setPreview(null)
        onImportSuccess(data.imported)
      }
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Bulk Import — {info.label}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Paste multiple {info.block}s at once using MN Syntax. Each block will be saved as a separate record.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {info.tag}
        </Badge>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => setShowExample(!showExample)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span>View syntax example</span>
          <span className="text-slate-400">{showExample ? '▲' : '▼'}</span>
        </button>
        {showExample && (
          <div className="bg-slate-900 p-4">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {SYNTAX_EXAMPLES[type]}
            </pre>
            <button
              onClick={() => { setRawText(SYNTAX_EXAMPLES[type]); setShowExample(false); setPreview(null); setResult(null) }}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Use this example as a starting point
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Paste MN Syntax here
        </label>
        <Textarea
          value={rawText}
          onChange={e => { setRawText(e.target.value); setPreview(null); setResult(null) }}
          placeholder={`Paste your ${info.label.toLowerCase()} here using MN Syntax...`}
          className="font-mono text-sm min-h-[280px] resize-y bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        />
        <p className="text-xs text-slate-400">
          You can paste multiple blocks. Each will be imported as a separate record.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handlePreview} disabled={!rawText.trim()}>
          Preview
        </Button>
        <Button
          onClick={handleImport}
          disabled={!rawText.trim() || importing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {importing ? 'Importing...' : `Import ${info.label}`}
        </Button>
        {rawText && (
          <button
            onClick={() => { setRawText(''); setPreview(null); setResult(null) }}
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      {preview && (
        <div className={`rounded-lg border p-4 space-y-3 ${
          preview.errors.length > 0
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
            : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{preview.errors.length > 0 ? '⚠️' : '✅'}</span>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Preview Result</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <strong>{preview.count}</strong> valid {info.block}(s) found and ready to import.
          </p>
          {preview.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {preview.errors.length} issue(s) found — these blocks will be skipped:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {preview.errors.map((err, i) => (
                  <li key={i} className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={`rounded-lg border p-4 ${
          result.success
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        }`}>
          {result.success ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                Successfully imported {result.imported} {info.block}(s) into this lecture.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <span className="text-sm font-semibold text-red-800 dark:text-red-300">
                {result.error}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}