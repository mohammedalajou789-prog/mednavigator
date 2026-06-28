import type { University } from '@/types/database'

// ── Design tokens ──────────────────────────────────────────────────────────
const PRIMARY  = '#2563EB'
const INK      = '#0F172A'
const INK2     = '#64748B'
const CARD_BDR = '#E2E8F0'

interface UniversityHeaderProps {
  university: University
  subjectCount: number
}

export default function UniversityHeader({ university, subjectCount }: UniversityHeaderProps) {
  const initials = university.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>

        {/* Logo */}
        {university.logo_url ? (
          <img
            src={university.logo_url}
            alt={university.name}
            style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${CARD_BDR}` }}
          />
        ) : (
          <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: `rgba(37,99,235,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: PRIMARY }}>{initials}</span>
          </div>
        )}

        {/* Name + count */}
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-.02em', color: INK }}>
            {university.name}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '14px', color: INK2 }}>
            {subjectCount} {subjectCount === 1 ? 'subject' : 'subjects'} available
          </p>
        </div>
      </div>

      {/* Description */}
      {university.description && (
        <p style={{ margin: '12px 0 0', fontSize: '14px', color: INK2, lineHeight: 1.6, maxWidth: '600px' }}>
          {university.description}
        </p>
      )}
    </div>
  )
}