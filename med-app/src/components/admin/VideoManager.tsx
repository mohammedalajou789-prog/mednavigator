'use client'

import { useState } from 'react'

interface Video {
  id: string
  title: string
  description: string | null
  video_url: string
  is_preview: boolean
  display_order: number
}

interface VideoManagerProps {
  lectureId: string
  subjectId: string
  existingVideos: Video[]
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function VideoManager({ lectureId, subjectId, existingVideos }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>(existingVideos)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const previewId = videoUrl ? getYouTubeId(videoUrl) : null

  async function handleAdd() {
    if (!title.trim() || !videoUrl.trim()) {
      showMessage('error', 'Title and Video URL are required.')
      return
    }
    if (!getYouTubeId(videoUrl)) {
      showMessage('error', 'Invalid YouTube URL. Please check the link.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_id: lectureId,
          subject_id: subjectId,
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim(),
          is_preview: isPreview,
          display_order: videos.length,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showMessage('error', data.error || 'Failed to save video.')
        return
      }

      setVideos(prev => [...prev, data.video])
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setIsPreview(false)
      showMessage('success', 'Video added successfully!')
    } catch {
      showMessage('error', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(videoId: string) {
    setDeleting(videoId)
    try {
      const res = await fetch(`/api/admin/videos?id=${videoId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) {
        showMessage('error', data.error || 'Failed to delete video.')
        return
      }

      setVideos(prev => prev.filter(v => v.id !== videoId))
      showMessage('success', 'Video removed.')
    } catch {
      showMessage('error', 'Network error. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Video Lectures
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add YouTube videos to this lecture. Students will see a Video tab when videos are available.
        </p>
      </div>

      {/* Add Video Form */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 space-y-4 border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Add New Video</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Heart Failure — Lecture 1"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              YouTube URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* URL Preview */}
          {videoUrl && (
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              {previewId ? (
                <img
                  src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                  alt="Video preview"
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-12 flex items-center justify-center bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs">
                  Invalid YouTube URL
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this video..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPreview}
              onChange={e => setIsPreview(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Mark as Free Preview
              <span className="ml-1 text-xs text-slate-400">(visible to all users)</span>
            </span>
          </label>
        </div>

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={saving || !title.trim() || !videoUrl.trim()}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Adding...' : '+ Add Video'}
        </button>
      </div>

      {/* Existing Videos List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Videos in this lecture ({videos.length})
          </p>
          <div className="space-y-2">
            {videos.map((video, index) => {
              const vid = getYouTubeId(video.video_url)
              return (
                <div
                  key={video.id}
                  className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
                >
                  <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                    {vid ? (
                      <img
                        src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No preview
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {index + 1}. {video.title}
                    </p>
                    <p className="text-xs text-slate-400 font-mono truncate">{video.video_url}</p>
                    {video.is_preview && (
                      <span className="text-xs text-green-600 dark:text-green-400">Free Preview</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deleting === video.id}
                    className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    {deleting === video.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {videos.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No videos added yet. Add the first video above.
        </div>
      )}
    </div>
  )
}