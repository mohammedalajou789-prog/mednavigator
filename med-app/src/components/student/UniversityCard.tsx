'use client'
import Link from 'next/link'
import type { University } from '@/types/database'

// ── Design tokens ──────────────────────────────────────────────────────────
const PRIMARY  = '#2563EB'
const CARD_BG  = '#FFFFFF'
const CARD_BDR = '#E2E8F0'
const INK      = '#0F172A'
const INK3     = '#94A3B8'

interface UniversityCardProps {
  university: University
}

export default function UniversityCard({ university }: UniversityCardProps) {
  const initials = university.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Link
      href={`/${(university as any).slug ?? university.id}`}
      prefetch={false}
      style={{
        display: 'block', textDecoration: 'none',
        background: CARD_BG, border: `1px solid ${CARD_BDR}`,
        borderRadius: '18px', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)',
        transition: 'box-shadow .2s, border-color .2s, transform .2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 16px 36px -16px rgba(37,99,235,.20)'
        el.style.borderColor = 'rgba(37,99,235,.30)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = '0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)'
        el.style.borderColor = CARD_BDR
      }}
    >
      {/* Logo area */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        {university.logo_url ? (
          <img
            src={university.logo_url}
            alt={university.name}
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${CARD_BDR}`, flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `rgba(37,99,235,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: PRIMARY }}>{initials}</span>
          </div>
        )}

        <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: INK, letterSpacing: '-.01em', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {university.name}
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: INK3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Resources available
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${CARD_BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', color: PRIMARY }}>
          BROWSE SUBJECTS
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </Link>
  )
}