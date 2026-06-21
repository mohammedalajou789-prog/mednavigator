'use client'

import { useState, useRef } from 'react'

interface ImageUploaderProps {
  entityType: string
  entityId: string
  slotNumber: number
  existingUrl?: string | null
  onUploadSuccess: (url: string, slotNumber: number) => void
}

export default function ImageUploader({
  entityType,
  entityId,
  slotNumber,
  existingUrl,
  onUploadSuccess,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entity_type', entityType)
      formData.append('entity_id', entityId)
      formData.append('slot_number', String(slotNumber))

      const res = await fetch('/api/admin/images', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed.')
        return
      }

      setPreview(data.url)
      onUploadSuccess(data.url, slotNumber)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
          [IMAGE_SLOT:{slotNumber}]
        </span>
        {preview && (
          <span className="text-xs text-green-600 dark:text-green-400">✓ Uploaded</span>
        )}
      </div>

      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <img
            src={preview}
            alt={`Slot ${slotNumber}`}
            className="w-full max-h-48 object-contain bg-slate-50 dark:bg-slate-900"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium"
          >
            Replace Image
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click or drag image here
              </p>
              <p className="text-xs text-slate-400">JPEG, PNG, WebP — max 5MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}