'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLectureData } from './LectureDataProvider'
import { LECTURE_TAB_ICONS, LECTURE_TAB_LABELS } from './lectureTabConfig'

export default function LectureMobileTabs({ activeTab }: { activeTab: string }) {
  const { availableTabs } = useLectureData()
  const params = useParams()
  const uniSlug = params.uniSlug as string
  const subjectSlug = params.subjectSlug as string
  const lectureSlug = params.lectureSlug as string

  return (
    <div className="lg:hidden flex gap-1 px-4 pt-3 pb-2 bg-white border-b border-slate-100 overflow-x-auto" style={{ flexShrink: 0 }}>
      {availableTabs.map((tabId) => {
        const isActive = tabId === activeTab
        return (
          <Link
            key={tabId}
            href={`/${uniSlug}/${subjectSlug}/${lectureSlug}/${tabId}`}
            prefetch={false}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
              borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              background: isActive ? '#EEF3FF' : '#F3F4F6',
              color: isActive ? '#2563EB' : '#6B7280',
              whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none',
            }}
          >
            {LECTURE_TAB_ICONS[tabId]}
            {LECTURE_TAB_LABELS[tabId]}
          </Link>
        )
      })}
    </div>
  )
}