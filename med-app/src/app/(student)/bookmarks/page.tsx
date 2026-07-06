import { requireAuth } from '@/lib/services/user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BookmarksPage() {
  const supabase = await createServerClient()
  const profile = await requireAuth()

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('id, bookmark_type, created_at, lecture_id, subject_id, lectures(id, title, subject_id, subjects(id, name, university_id)), subjects(id, name, university_id)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    subject: {
      label: 'Subject',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
      color: 'var(--primary)',
      bg: 'rgba(47,107,255,0.11)',
    },
    lecture: {
      label: 'Lecture',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
      color: 'var(--primary)',
      bg: 'rgba(47,107,255,0.11)',
    },
    question: {
      label: 'Question',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      color: '#D89A06',
      bg: 'rgba(216,154,6,0.11)',
    },
    flashcard: {
      label: 'Flashcard',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.11)',
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ padding: '28px 28px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em' }}>
            Bookmarks
          </h1>
          <div style={{ color: 'var(--ink-2)', fontSize: 14.5 }}>
            {bookmarks?.length ?? 0} saved items
          </div>
        </div>

        {/* Empty State */}
        {!bookmarks || bookmarks.length === 0 ? (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(47,107,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>No bookmarks yet</p>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0 }}>Save subjects and lectures to find them quickly.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookmarks.map(bm => {
              const directSubject = bm.subjects as Record<string, unknown> | null
              const lecture = bm.lectures as Record<string, unknown> | null
              const lectureSubject = lecture?.subjects as Record<string, unknown> | null

              const label = bm.bookmark_type === 'subject'
                ? String(directSubject?.name ?? 'Unknown Subject')
                : String(lecture?.title ?? 'Unknown Lecture')

              const sublabel = bm.bookmark_type === 'lecture' && lectureSubject
                ? `Lecture · ${String(lectureSubject.name ?? '')}`
                : bm.bookmark_type === 'subject' ? 'Subject' : bm.bookmark_type

              const href = bm.bookmark_type === 'subject' && directSubject
                ? `/${directSubject.university_id}/${directSubject.id}`
                : lecture && lectureSubject
                ? `/${lectureSubject.university_id}/${lectureSubject.id}/${lecture.id}`
                : '#'

              const config = TYPE_CONFIG[bm.bookmark_type] ?? TYPE_CONFIG.lecture
              const dateStr = bm.created_at
                ? new Date(bm.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                : ''

              return (
                <Link key={bm.id} href={href} prefetch={false} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 15,
                    boxShadow: 'var(--shadow)',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                  }}>
                    {/* Icon */}
                    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: config.bg, color: config.color }}>
                      {config.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>
                        {sublabel}
                      </div>
                    </div>

                    {/* Date */}
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {dateStr}
                    </span>

                    {/* Arrow */}
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}