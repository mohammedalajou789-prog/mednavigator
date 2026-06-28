import { requireAuth } from '@/lib/services/user'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NotesPage() {
  const profile = await requireAuth()
  const supabase = await createServerClient()

  const { data: notes } = await supabase
    .from('user_notes')
    .select(`
      id,
      note_content,
      created_at,
      updated_at,
      lecture_id,
      lectures (
        id,
        title,
        subject_id,
        subjects (
          id,
          name,
          university_id,
          universities ( id, name )
        )
      )
    `)
    .eq('user_id', profile.id)
    .not('note_content', 'is', null)
    .neq('note_content', '')
    .order('updated_at', { ascending: false })

  function formatDate(dateStr: string | null) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 28px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em' }}>
            My Notes
          </h1>
          <div style={{ color: 'var(--ink-2)', fontSize: 14.5 }}>
            {notes?.length ?? 0} personal note{(notes?.length ?? 0) !== 1 ? 's' : ''} across your lectures
          </div>
        </div>

        {/* Empty State */}
        {(!notes || notes.length === 0) && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(216,154,6,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="13" y2="17"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>No notes yet</p>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: '0 auto 24px', maxWidth: 320, lineHeight: 1.6 }}>
              You can add personal notes while reading any lecture. They are private and only visible to you.
            </p>
            <Link href="/home" style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Browse Lectures
            </Link>
          </div>
        )}

        {/* Notes Grid */}
        {notes && notes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {notes.map(note => {
              const lecture = note.lectures as any
              const subject = lecture?.subjects as any
              const university = subject?.universities as any

              return (
                <div key={note.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>

                  {/* Card Header */}
                  <div style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(216,154,6,0.13)', color: 'var(--warn)' }}>
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                        {lecture?.title ?? 'Lecture'}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        {subject?.name && (
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{subject.name}</span>
                        )}
                        {university?.name && (
                          <span style={{ color: 'var(--ink-3)' }}> · {university.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div style={{ margin: '14px 18px', padding: 14, borderRadius: 12, background: 'color-mix(in srgb,var(--warn) 9%,transparent)', borderLeft: '3px solid var(--warn)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
                    {note.note_content}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '12px 18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      Updated {formatDate(note.updated_at)}
                    </span>
                    <Link
                      href={`/${subject?.university_id}/${subject?.id}/${lecture?.id}`}
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      Open lecture
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* Add note placeholder */}
            <div style={{ border: '1px dashed var(--line)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8, padding: 30, color: 'var(--ink-3)', minHeight: 180 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
              </svg>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>Add a new note</div>
              <div style={{ fontSize: 12.5 }}>Jot down key points while you study.</div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}