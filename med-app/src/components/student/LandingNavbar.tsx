'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { University } from '@/types/database'

// ── Design tokens ──────────────────────────────────────────────────────────
const PRIMARY  = '#2563EB'
const CARD_BG  = '#FFFFFF'
const CARD_BDR = '#E2E8F0'
const INK      = '#0F172A'
const INK2     = '#64748B'
const INK3     = '#94A3B8'

interface LandingNavbarProps {
  universities: University[]
}

const LogoIcon = () => (
  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  </div>
)

export default function LandingNavbar({ universities }: LandingNavbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleUniversitySelect(uniPath: string) {
    setDropdownOpen(false)
    router.push(`/${uniPath}`)
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(248,250,252,0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${CARD_BDR}`,
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <LogoIcon />
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.02em', color: INK }}>
            Med<span style={{ color: PRIMARY }}>Navigator</span>
          </span>
        </Link>

        {/* University selector */}
        <div style={{ position: 'relative' }} className="hidden sm:block">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 14px', border: `1px solid ${CARD_BDR}`, borderRadius: '10px', background: CARD_BG, fontSize: '13.5px', color: INK2, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = CARD_BDR)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={INK3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/>
            </svg>
            Select your university
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INK3} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              width: '260px', background: CARD_BG,
              border: `1px solid ${CARD_BDR}`, borderRadius: '14px',
              boxShadow: '0 8px 30px rgba(15,23,42,.12)', overflow: 'hidden', zIndex: 50,
            }}>
              {universities.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: '13.5px', color: INK3 }}>
                  No universities available yet.
                </div>
              ) : (
                <div style={{ padding: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                  {universities.map((uni) => (
                    <button
                      key={uni.id}
                      onClick={() => handleUniversitySelect((uni as any).slug ?? uni.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', color: INK, textAlign: 'left', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {uni.logo_url ? (
                        <img src={uni.logo_url} alt={uni.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${CARD_BDR}` }} />
                      ) : (
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `rgba(37,99,235,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: PRIMARY }}>{uni.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/login"
            style={{ display: 'inline-flex', alignItems: 'center', height: '38px', padding: '0 16px', borderRadius: '10px', border: `1px solid ${CARD_BDR}`, background: CARD_BG, fontSize: '13.5px', fontWeight: 600, color: INK, textDecoration: 'none', transition: 'border-color .15s' }}
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{ display: 'inline-flex', alignItems: 'center', height: '38px', padding: '0 16px', borderRadius: '10px', border: 'none', background: PRIMARY, fontSize: '13.5px', fontWeight: 600, color: '#fff', textDecoration: 'none' }}
          >
            Register
          </Link>
        </div>

      </div>
    </nav>
  )
}