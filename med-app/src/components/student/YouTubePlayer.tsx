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

interface YouTubePlayerProps {
  videos: Video[]
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

export default function YouTubePlayer({ videos }: YouTubePlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeVideo = videos[activeIndex]
  const videoId = activeVideo ? getYouTubeId(activeVideo.video_url) : null

  return (
    <div className="space-y-4">

      <div className="bg-black rounded-xl overflow-hidden aspect-video w-full">
        {videoId ? (
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm">
            Invalid video URL
          </div>
        )}
      </div>

      <div className="px-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          {activeVideo?.title}
        </h3>
        {activeVideo?.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeVideo.description}
          </p>
        )}
      </div>

      {videos.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            All Videos ({videos.length})
          </p>
          <div className="space-y-1">
            {videos.map((video, index) => {
              const vid = getYouTubeId(video.video_url)
              return (
                <button
                  key={video.id}
                  onClick={() => setActiveIndex(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    index === activeIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                    {vid ? (
                      <img
                        src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No preview
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      index === activeIndex
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {index + 1}. {video.title}
                    </p>
                    {video.is_preview && (
                      <span className="text-xs text-green-600 dark:text-green-400">Free Preview</span>
                    )}
                  </div>

                  {index === activeIndex && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}