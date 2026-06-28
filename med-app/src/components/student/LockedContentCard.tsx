'use client'

const PRIMARY  = '#2563EB'
const AMBER    = '#D97706'
const CARD_BG  = '#FFFFFF'
const CARD_BDR = '#E2E8F0'
const INK      = '#0F172A'
const INK2     = '#64748B'

interface LockedContentCardProps {
  subjectName?: string
  contentType?: 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years' | 'video'
}

const contentTypeLabels: Record<string, string> = {
  sheet: 'Sheet',
  summary: 'Summary',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  previous_years: 'Previous Years Questions',
  video: 'Video Lecture',
}

const STEPS = [
  'Complete the payment',
  'Send proof via WhatsApp',
  'Your subscription will be activated',
]

export default function LockedContentCard({ subjectName, contentType }: LockedContentCardProps) {
  const label = contentType ? contentTypeLabels[contentType] : 'Content'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '420px', padding: '48px 24px', textAlign: 'center' }}>

      <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(217,119,6,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: INK }}>
        {label} — Access Required
      </h2>

      {subjectName && (
        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: PRIMARY }}>
          {subjectName}
        </p>
      )}

      <p style={{ margin: '10px 0 0', fontSize: '13.5px', color: INK2, maxWidth: '360px', lineHeight: 1.65 }}>
        This content requires an active subscription. Complete the payment and contact support to activate your access.
      </p>

      <div style={{ marginTop: '28px', padding: '18px 20px', borderRadius: '16px', background: CARD_BG, border: `1px solid ${CARD_BDR}`, maxWidth: '300px', width: '100%', textAlign: 'left' }}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: INK }}>
          How to get access
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37,99,235,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: PRIMARY }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: '13px', color: INK2 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 20px', borderRadius: '11px', background: '#25D366', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3a3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z"/>
        </svg>
        Contact via WhatsApp
      </a>

    </div>
  )
}