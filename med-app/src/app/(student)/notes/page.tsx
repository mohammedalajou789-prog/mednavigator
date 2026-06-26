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
    <div style={{ background: '#F5F6FA', minHeight: '100%', padding: '28px 32px 80px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            My Notes
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>
            {notes?.length ?? 0} personal note{(notes?.length ?? 0) !== 1 ? 's' : ''} across your lectures
          </p>
        </div>
      </div>

      {/* Empty state */}
      {(!notes || notes.length === 0) && (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '64px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="13" y2="17"/>
            </svg>
          </div>
          <p style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>No notes yet</p>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 24px', maxWidth: '320px', lineHeight: 1.6, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
            You can add personal notes while reading any lecture. They are private and only visible to you.
          </p>
          <Link href="/home" style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Browse Lectures
          </Link>
        </div>
      )}

      {/* Notes grid */}
      {notes && notes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {notes.map(note => {
            const lecture = note.lectures as any
            const subject = lecture?.subjects as any
            const university = subject?.universities as any

            return (
              <div
                key={note.id}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'box-shadow 0.15s',
                }}
              >
                {/* Note header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="8" y1="17" x2="13" y2="17"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lecture?.title ?? 'Lecture'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                      {subject?.name && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                          {subject.name}
                        </span>
                      )}
                      {university?.name && (
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{university.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Note content */}
                <div style={{ background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {note.note_content}
                  </p>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Updated {formatDate(note.updated_at)}
                  </span>
                  <Link
                    href={`/${subject?.university_id}/${subject?.id}/${lecture?.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
                  >
                    Open lecture
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}