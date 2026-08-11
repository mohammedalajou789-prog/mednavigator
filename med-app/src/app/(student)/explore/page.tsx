'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

interface University {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  description: string | null
  country: string | null
}

// Per-university tint color based on first letter
function getTint(name: string): string {
  const tints = ['#2563EB','#9333EA','#B91C1C','#0F766E','#EA580C','#1D4ED8','#065F46','#92400E','#1E40AF','#6D28D9']
  const idx = name.charCodeAt(0) % tints.length
  return tints[idx]
}

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`
}

export default function ExplorePageClient() {
  const [unis,    setUnis   ] = useState<University[]>([])
  const [counts,  setCounts ] = useState<Record<string, number>>({})
  const [query,   setQuery  ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('universities').select('id,name,logo_url,slug,description,country').eq('is_active', true).order('name') as any,
      supabase.from('subjects').select('university_id,id').eq('is_published', true),
    ]).then(([{ data: u }, { data: s }]) => {
      setUnis((u ?? []) as any as University[])
      const map: Record<string, number> = {}
      ;(s ?? []).forEach((r: any) => { map[r.university_id] = (map[r.university_id] ?? 0) + 1 })
      setCounts(map)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return unis
    return unis.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.country ?? '').toLowerCase().includes(q)
    )
  }, [unis, query])

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes crestIn { from{opacity:0;transform:scale(.7) rotate(-8deg)}to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes shine   { 0%{transform:translateX(-120%) rotate(20deg)}100%{transform:translateX(220%) rotate(20deg)} }
        @keyframes ring    { 0%{opacity:.7;transform:scale(1)}60%{opacity:0;transform:scale(1.18)}100%{opacity:0;transform:scale(1.18)} }
        .ex-card { transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease; }
        .ex-card:hover { transform:translateY(-4px); box-shadow:0 22px 40px -18px rgba(15,23,42,.28); border-color:#C7D8FF; }
      `}</style>

      <main style={{ padding:'clamp(16px,4vw,28px) clamp(16px,4vw,28px) 64px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:18, flexWrap:'wrap', marginBottom:28, animation:'fadeUp .5s ease backwards' }}>
          <div>
            <h1 style={{ fontSize:'clamp(22px,5vw,28px)', fontWeight:800, letterSpacing:'-.025em', lineHeight:1.2, margin:0 }}>Explore Universities</h1>
            <p style={{ fontSize:14.5, lineHeight:1.6, color:'#475569', marginTop:4, marginBottom:0 }}>Browse subjects and content from all universities on the platform.</p>
          </div>

          {unis.length >= 10 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, width:320, maxWidth:'100%', background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'10px 14px', boxShadow:'0 4px 14px -10px rgba(15,23,42,.18)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search universities"
              style={{ flex:1, minWidth:0, border:'none', outline:'none', fontSize:14, fontWeight:500, color:'#0F172A', background:'transparent' }}
            />
            <span style={{ fontSize:12, fontWeight:700, color:'#94A3B8', whiteSpace:'nowrap' }}>
              {loading ? '...' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,286px),1fr))', gap:'clamp(14px,2.4vw,22px)' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background:'#fff', border:'1px solid #E7EDF5', borderRadius:26, padding:'0 22px 20px', overflow:'hidden', textAlign:'center', boxShadow:'0 6px 22px -14px rgba(15,23,42,.18)', opacity:.5 }}>
                <div style={{ height:132, background:'linear-gradient(180deg,#EEF2F7,transparent)' }}/>
                <div style={{ width:112, height:112, borderRadius:'50%', background:'#E2E8F0', margin:'-56px auto 0' }}/>
                <div style={{ height:18, background:'#E2E8F0', borderRadius:6, margin:'20px auto 0', width:'60%' }}/>
                <div style={{ height:13, background:'#F1F5F9', borderRadius:6, margin:'8px auto 0', width:'40%' }}/>
                <div style={{ height:28, background:'#F1F5F9', borderRadius:99, margin:'14px auto 0', width:'45%' }}/>
                <div style={{ height:1, background:'#EEF2F8', margin:'18px 0 0' }}/>
                <div style={{ height:14, background:'#EEF2F8', borderRadius:6, margin:'16px auto 0', width:'55%' }}/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div style={{ border:'1.5px dashed #DCE4EF', borderRadius:24, padding:'64px 30px', textAlign:'center', marginTop:26, background:'rgba(255,255,255,.6)' }}>
            <div style={{ width:56, height:56, margin:'0 auto 14px', borderRadius:'50%', background:'#EEF2F8', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div style={{ fontSize:15, fontWeight:700 }}>No universities match that search</div>
            <div style={{ fontSize:13.5, color:'#94A3B8', marginTop:4 }}>Try a different name or clear the field.</div>
          </div>
        ) : (
          /* Grid */
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,286px),1fr))', gap:'clamp(14px,2.4vw,22px)' }}>
            {filtered.map((uni, i) => {
              const count   = counts[uni.id] ?? 0
              const tint    = getTint(uni.name)
              const delay   = `${(0.06 * i).toFixed(2)}s`
              const pillInk = count === 0 ? '#94A3B8' : tint
              const pillBg  = count === 0 ? '#F1F5F9' : hexToRgba(tint, 0.09)
              const aura    = `radial-gradient(circle at 50% 50%,${hexToRgba(tint,0.13)} 0%,${hexToRgba(tint,0)} 68%)`
              const crest   = `linear-gradient(180deg,${hexToRgba(tint,0.07)} 0%,rgba(255,255,255,0) 100%)`
              const initial = uni.name.replace(/^(The|University of)\s+/i,'').charAt(0).toUpperCase()
              const location = uni.country ?? ''

              return (
                <Link key={uni.id} href={`/${uni.slug ?? uni.id}`} prefetch={false} style={{ display:'block', animation:'fadeUp .5s ease backwards', animationDelay:delay, textDecoration:'none', color:'inherit' }}>
                  <div className="ex-card" style={{ position:'relative', background:'#fff', border:'1px solid #E7EDF5', borderRadius:26, padding:'0 22px 20px', overflow:'hidden', textAlign:'center', boxShadow:'0 6px 22px -14px rgba(15,23,42,.18)' }}>

                    {/* Crest gradient background */}
                    <div style={{ position:'absolute', inset:'0 0 auto', height:132, background:crest, pointerEvents:'none' }}/>
                    {/* Aura blob */}
                    <div style={{ position:'absolute', top:-58, left:'50%', width:230, height:230, marginLeft:-115, borderRadius:'50%', background:aura, pointerEvents:'none' }}/>

                    {/* Logo */}
                    <div style={{ position:'relative', paddingTop:34, display:'flex', justifyContent:'center' }}>
                      <div style={{ position:'relative', width:112, height:112, animation:'crestIn .55s cubic-bezier(.34,1.5,.64,1) backwards', animationDelay:delay }}>
                        {/* Ring pulse */}
                        <div style={{ position:'absolute', inset:-10, borderRadius:'50%', border:`1.5px solid ${tint}`, animation:'ring 3.4s ease-out infinite', animationDelay:delay }}/>
                        {/* Logo circle */}
                        <div style={{ position:'relative', width:112, height:112, borderRadius:'50%', background:'#fff', border:'1px solid #E7EDF5', boxShadow:'0 16px 30px -14px rgba(15,23,42,.3)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {uni.logo_url ? (
                            <img src={uni.logo_url} alt={uni.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          ) : (
                            <span style={{ fontSize:38, fontWeight:800, letterSpacing:'-.03em', color:tint }}>{initial}</span>
                          )}
                          {/* Shine */}
                          <div style={{ position:'absolute', top:0, left:0, width:'38%', height:'100%', background:'linear-gradient(75deg,transparent,rgba(255,255,255,.8) 45%,transparent 92%)', animation:'shine 4.2s ease-in-out infinite', animationDelay:delay, pointerEvents:'none' }}/>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ position:'relative', marginTop:20 }}>
                      <div style={{ fontSize:17.5, fontWeight:800, letterSpacing:'-.02em', lineHeight:1.3, color:'#0F172A' }}>{uni.name}</div>
                      {location && (
                        <div style={{ fontSize:12.5, fontWeight:600, color:'#94A3B8', marginTop:5 }}>{location}</div>
                      )}

                      {/* Subject count pill */}
                      <div style={{ display:'flex', justifyContent:'center', marginTop:14 }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:99, color:pillInk, background:pillBg }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
                          {count === 0 ? 'No subjects yet' : `${count} subject${count === 1 ? '' : 's'}`}
                        </span>
                      </div>

                      {/* Browse footer */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:18, paddingTop:16, borderTop:'1px solid #EEF2F8', fontSize:12, fontWeight:800, letterSpacing:'.08em', color:'#2563EB' }}>
                        <span>BROWSE SUBJECTS</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </div>
                    </div>

                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </main>
    </>
  )
}