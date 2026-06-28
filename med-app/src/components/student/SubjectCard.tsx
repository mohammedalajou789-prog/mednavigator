import Link from 'next/link'
import type { Subject } from '@/types/database'

const PRIMARY  = '#2563EB'
const SUCCESS  = '#16A34A'
const AMBER    = '#D97706'
const PURPLE   = '#7C3AED'
const CARD_BG  = '#FFFFFF'
const CARD_BDR = '#E2E8F0'
const INK      = '#0F172A'
const INK2     = '#64748B'
const INK3     = '#94A3B8'

interface SubjectCardProps {
  subject: Subject
  universityId: string
}

const TYPE_STYLES: Record<string, { bg: string; color: string; bar: string }> = {
  standard: { bg: `rgba(37,99,235,0.10)`,  color: PRIMARY, bar: `linear-gradient(90deg,${PRIMARY},${PURPLE})` },
  system:   { bg: `rgba(124,58,237,0.10)`, color: PURPLE,  bar: `linear-gradient(90deg,${PURPLE},${PRIMARY})` },
  clinical: { bg: `rgba(22,163,74,0.10)`,  color: SUCCESS, bar: `linear-gradient(90deg,${SUCCESS},${PRIMARY})` },
}

const ACCESS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  free:    { bg: `rgba(22,163,74,0.10)`,  color: SUCCESS, label: 'Free' },
  premium: { bg: `rgba(217,119,6,0.12)`,  color: AMBER,   label: 'Premium' },
  mixed:   { bg: '#F1F5F9',               color: INK2,    label: 'Mixed' },
}

export default function SubjectCard({ subject, universityId }: SubjectCardProps) {
  const typeKey     = subject.subject_type as keyof typeof TYPE_STYLES
  const accessKey   = subject.access_mode  as keyof typeof ACCESS_STYLES
  const typeStyle   = TYPE_STYLES[typeKey]   ?? TYPE_STYLES.standard
  const accessStyle = ACCESS_STYLES[accessKey] ?? ACCESS_STYLES.free
  const typeLabel   = subject.subject_type.charAt(0).toUpperCase() + subject.subject_type.slice(1)
  const isPremium   = subject.access_mode === 'premium'

  return (
    <Link
      href={`/${universityId}/${(subject as any).slug ?? subject.id}`}
      prefetch={false}
      className="group flex flex-col overflow-hidden text-[unset] no-underline hover:-translate-y-1 transition-transform duration-200"
      style={{ background: CARD_BG, border: `1px solid ${CARD_BDR}`, borderRadius: '18px', boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)', textDecoration: 'none' }}
    >
      {/* Top color bar */}
      <div style={{ height: '5px', background: typeStyle.bar, flexShrink: 0 }} />

      {/* Body */}
      <div style={{ padding: '18px 20px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '7px', background: typeStyle.bg, color: typeStyle.color }}>
              {typeLabel}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '7px', background: accessStyle.bg, color: accessStyle.color }}>
              {accessStyle.label}
            </span>
          </div>
          {isPremium && (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          )}
        </div>

        {/* Name */}
        <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, letterSpacing: '-.01em', color: INK, lineHeight: 1.3, flex: 1 }}>
          {subject.name}
        </h3>

        {/* Description */}
        {subject.description && (
          <p style={{ margin: '0 0 14px', fontSize: '13.5px', lineHeight: 1.55, color: INK2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {subject.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: `1px solid ${CARD_BDR}`, marginTop: 'auto' }}>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: accessStyle.color }}>
            {(subject.price ?? 0) > 0 ? `${subject.price} JOD` : `${accessStyle.label} access`}
          </span>
          <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={INK3} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}