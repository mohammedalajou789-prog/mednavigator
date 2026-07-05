'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LectureData {
  id: string
  title: string
  slug: string
  completed: boolean
  progress: number
  hasSheet: boolean
  hasSummary: boolean
  flashCount: number
  quizCount: number
  pyqCount: number
}

interface GroupData {
  id: string
  title: string
  lectures: LectureData[]
}

interface Props {
  groups: GroupData[]
  uniSlug: string
  subjectSlug: string
  isSystem: boolean
}

export default function ChapterAccordion({ groups, uniSlug, subjectSlug }: Props) {
  const [openId, setOpenId] = useState<string | null>(groups[0]?.id ?? null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map(group => {
        const isOpen = openId === group.id
        const completedInGroup = group.lectures.filter(l => l.completed).length
        const totalInGroup = group.lectures.length
        const groupProgress = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0

        return (
          <div
            key={group.id}
            style={{
              background: 'var(--card)',
              border: `1.5px solid ${isOpen ? 'rgba(47,107,255,0.35)' : 'var(--line)'}`,
              borderRadius: 18,
              boxShadow: isOpen ? '0 4px 24px rgba(47,107,255,0.08)' : 'var(--shadow)',
              overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            {/* Chapter Header — clickable */}
            <button
              onClick={() => setOpenId(isOpen ? null : group.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 22px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isOpen ? 'rgba(47,107,255,0.13)' : 'var(--bg-2)',
                color: isOpen ? '#2F6BFF' : 'var(--ink-3)',
                transition: 'background 0.2s, color 0.2s',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>
                  {group.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>
                    {totalInGroup} lecture{totalInGroup !== 1 ? 's' : ''}
                  </span>
                  {completedInGroup > 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: completedInGroup === totalInGroup ? 'var(--success)' : '#A1730A',
                      background: completedInGroup === totalInGroup ? 'rgba(19,138,90,0.1)' : 'rgba(234,179,8,0.1)',
                      padding: '3px 10px', borderRadius: 999,
                    }}>
                      {completedInGroup === totalInGroup ? '✓ All done' : `${completedInGroup}/${totalInGroup} done`}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                {groupProgress > 0 && (
                  <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 99, marginTop: 10, width: '100%', maxWidth: 320 }}>
                    <div style={{
                      height: '100%',
                      width: `${groupProgress}%`,
                      background: groupProgress === 100 ? 'var(--success)' : '#2F6BFF',
                      borderRadius: 99,
                    }} />
                  </div>
                )}
              </div>

              {/* Chevron */}
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={isOpen ? '#2F6BFF' : 'var(--ink-3)'} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Lectures List — revealed when open */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {group.lectures.map((lecture, idx) => {
                  const isDone = lecture.completed
                  const pct = lecture.progress
                  const statusLabel = isDone ? 'Completed' : pct > 0 ? `${pct}%` : 'Not started'
                  const statusColor = isDone ? 'var(--success)' : pct > 0 ? '#A1730A' : 'var(--ink-3)'
                  const statusBg    = isDone ? 'rgba(19,138,90,0.1)' : pct > 0 ? 'rgba(234,179,8,0.1)' : 'var(--bg-2)'

                  return (
                    <div key={lecture.id}>
                      {idx > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 22px' }} />}
                      <div style={{ padding: '16px 22px' }}>

                        {/* Lecture row */}
                        <Link
                          href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`}
                          prefetch={false}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            textDecoration: 'none', color: 'inherit',
                            borderRadius: 12, padding: '8px 10px', margin: '-8px -10px',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDone ? 'rgba(19,138,90,0.11)' : 'rgba(47,107,255,0.09)',
                            color: isDone ? 'var(--success)' : 'var(--primary)',
                          }}>
                            {isDone
                              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{lecture.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                              {lecture.flashCount > 0 && `${lecture.flashCount} flashcards`}
                              {lecture.flashCount > 0 && lecture.quizCount > 0 && ' · '}
                              {lecture.quizCount > 0 && `${lecture.quizCount} questions`}
                            </div>
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: statusColor, padding: '5px 11px', borderRadius: 8, background: statusBg, flexShrink: 0 }}>
                            {statusLabel}
                          </span>
                        </Link>

                        {/* Progress bar */}
                        {pct > 0 && (
                          <div style={{ height: 3, background: 'var(--bg-2)', margin: '12px 0 10px', borderRadius: 99 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: isDone ? 'var(--success)' : '#2F6BFF', borderRadius: 99 }} />
                          </div>
                        )}

                        {/* Content badges */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: pct > 0 ? 0 : 12 }}>
                          {lecture.hasSheet && (
                            <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid rgba(47,107,255,0.25)', background: 'rgba(47,107,255,0.07)', color: '#2F6BFF', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                              Sheet
                            </Link>
                          )}
                          {lecture.hasSummary && (
                            <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                              Summary
                            </Link>
                          )}
                          {lecture.flashCount > 0 && (
                            <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                              Flashcards
                            </Link>
                          )}
                          {lecture.quizCount > 0 && (
                            <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              Quiz
                            </Link>
                          )}
                          {lecture.pyqCount > 0 && (
                            <Link href={`/${uniSlug}/${subjectSlug}/${lecture.slug}`} prefetch={false}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              PYQ
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}