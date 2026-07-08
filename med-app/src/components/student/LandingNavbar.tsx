'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { University } from '@/types/database'

interface LandingNavbarProps {
  universities: University[]
}

export default function LandingNavbar({ universities }: LandingNavbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function handleUniversitySelect(uniPath: string) {
    setDropdownOpen(false)
    router.push(`/${uniPath}`)
  }

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(246,248,252,0.82)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #E8ECF2' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: 'linear-gradient(150deg,#16273F,#0D1B2A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px -5px rgba(13,27,42,.5)' }}>
            <svg width="23" height="23" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="16" stroke="#D7E3F4" strokeWidth="2.6"/>
              <path d="M5 24 H16 l2 -5 l3 10 l2 -5 H43" stroke="#D7E3F4" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 6 V24" stroke="#D7E3F4" strokeWidth="2.6" strokeLinecap="round"/>
              <path d="M24 24 V42" stroke="#5AA0FF" strokeWidth="2.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A' }}>
            Med<span style={{ color: '#2563EB' }}>Navigator</span>
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <button className="mn-nav-uni-btn" onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', border: '1px solid #E8ECF2', background: '#fff', borderRadius: '11px', fontSize: '13px', fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(15,23,42,.03)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/>
            </svg>
            Select your university
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {dropdownOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setDropdownOpen(false)} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '260px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '14px', boxShadow: '0 8px 30px rgba(15,23,42,.12)', overflow: 'hidden', zIndex: 50 }}>
                {universities.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>No universities available yet.</div>
                ) : (
                  <div style={{ padding: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                    {universities.map((uni) => (
                      <button key={uni.id} onClick={() => handleUniversitySelect((uni as any).slug ?? uni.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', color: '#0F172A', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {uni.logo_url
                          ? <img src={uni.logo_url} alt={uni.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #E8ECF2' }} />
                          : <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(37,99,235,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#2563EB' }}>{uni.name.slice(0,2).toUpperCase()}</span>
                            </div>
                        }
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <Link href="/login" style={{ padding: '9px 18px', borderRadius: '11px', border: '1px solid #E8ECF2', background: '#fff', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700, color: '#0F172A', textDecoration: 'none' }}>
          Login
        </Link>
        <Link href="/register" className="mn-nav-register" style={{ padding: '9px 20px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 20px -6px rgba(37,99,235,.6)' }}>
          Register
        </Link>
      </div>
      <style>{`
        @media (max-width: 600px) {
          .mn-nav-uni-btn { display: none !important; }
          .mn-nav-register { display: none !important; }
          .mn-nav-login { padding: 7px 14px !important; font-size: 13px !important; }
        }
      `}</style>
    </nav>
  )
}
