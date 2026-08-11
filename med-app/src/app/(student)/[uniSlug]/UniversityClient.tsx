'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Subject {
  id: string; name: string; slug: string | null; subject_type: string
  category: string | null; access_mode: string; description: string | null
  lecture_count: number; chapter_count: number; progress_pct: number; mastered_count: number
}
interface Section { key: string; label: string; tabLabel: string; list: Subject[]; barColor: string }
interface Props {
  university: { id:string; name:string; logo_url:string|null; description:string|null; country:string|null }
  subjectList: Subject[]; sections: Section[]; savedIds: string[]; userId: string|null; uniSlug: string
}

function getCategoryLabel(c: string|null) {
  if (c==='preclinical')    return 'Pre-Clinical'
  if (c==='clinical_major') return 'Clinical'
  if (c==='clinical_minor') return 'Minor'
  return 'General'
}
function getAccess(m: string) {
  if (m==='free')    return { color:'#D97706', bg:'rgba(217,119,6,0.11)',  label:'Free'    }
  if (m==='mixed')   return { color:'#D97706', bg:'rgba(217,119,6,0.11)',  label:'Mixed'   }
  if (m==='premium') return { color:'#DC2626', bg:'rgba(220,38,38,0.11)',  label:'Premium' }
  return { color:'#D97706', bg:'rgba(217,119,6,0.11)', label:'Free' }
}

export default function UniversityClient({ university, subjectList, sections, savedIds, userId, uniSlug }: Props) {
  const [saved,    setSaved   ] = useState(new Set(savedIds))
  const [cat,      setCat     ] = useState('all')
  const [sortBy,   setSortBy  ] = useState('default')

  function toggleSave(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    setSaved(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n })
  }
  function sorted(list: Subject[]) {
    const a=[...list]
    if (sortBy==='progress') a.sort((x,y)=>y.progress_pct-x.progress_pct)
    if (sortBy==='lectures') a.sort((x,y)=>y.lecture_count-x.lecture_count)
    return a
  }

  const visible = (cat==='all'?sections:sections.filter(s=>s.key===cat)).map(s=>({...s,list:sorted(s.list)}))
  const tabs = [{id:'all',label:'All'},...sections.map(s=>({id:s.key,label:s.tabLabel}))]

  return (
    <>
      <style>{`
        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes logoPop {from{opacity:0;transform:scale(.7) rotate(-8deg)}to{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes shine   {0%{transform:translateX(-120%) rotate(20deg)}100%{transform:translateX(220%) rotate(20deg)}}
        .mn-card{transition:transform .25s ease,box-shadow .25s ease}
        .mn-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px -14px rgba(37,99,235,.28) !important}
        .mn-save{transition:background .2s,color .2s,transform .15s}
        .mn-save:hover{transform:scale(1.05)}
      `}</style>


        <main style={{padding:'clamp(16px,4vw,28px) clamp(16px,4vw,28px) 64px'}}>

          {/* Breadcrumb */}
          <nav style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#94A3B8',marginBottom:20,animation:'fadeUp .45s ease backwards'}}>
            <Link href="/home" style={{fontWeight:600,color:'#64748B',textDecoration:'none'}}>Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{fontWeight:600,color:'#0F172A'}}>{university.name}</span>
          </nav>

          {/* Hero */}
          <div style={{position:'relative',borderRadius:22,overflow:'hidden',padding:'28px clamp(20px,4vw,32px)',marginBottom:32,background:'linear-gradient(120deg,#EFF4FF,#F5F1FF 60%,#EEFCF3)',animation:'fadeUp .5s ease .05s backwards'}}>
            <div style={{position:'relative',display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>

              {/* Logo */}
              <div style={{width:128,height:128,minWidth:128,borderRadius:'50%',border:'1px solid #E2E8F0',overflow:'hidden',flexShrink:0,background:'#fff',boxShadow:'0 10px 26px -8px rgba(15,23,42,0.2)',animation:'logoPop .6s cubic-bezier(.34,1.56,.64,1) .15s backwards',position:'relative'}}>
                {university.logo_url ? (
                  <><img src={university.logo_url} alt={university.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  <div style={{position:'absolute',top:0,left:0,width:'40%',height:'100%',background:'linear-gradient(75deg,transparent 0%,rgba(255,255,255,0.75) 45%,transparent 90%)',animation:'shine 3.2s ease-in-out infinite',animationDelay:'1s'}}/></>
                ):(
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#2563EB',color:'#fff',fontSize:36,fontWeight:800}}>{university.name.charAt(0)}</div>
                )}
              </div>

              {/* Text */}
              <div style={{flex:1,minWidth:180,position:'relative'}}>

                <div style={{position:'relative',zIndex:1}}>
                  <h1 style={{fontSize:'clamp(22px,5vw,30px)',fontWeight:800,letterSpacing:'-0.02em',color:'#0F172A',margin:0}}>{university.name}</h1>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700,color:'#2563EB',background:'rgba(37,99,235,0.1)',padding:'3px 10px',borderRadius:99,marginTop:8}}>
                    {subjectList.length} subjects available
                  </span>
                  {university.description&&<p style={{fontSize:13.5,lineHeight:1.6,color:'#94A3B8',marginTop:12,maxWidth:500,marginBottom:0}}>{university.description}</p>}
                </div>
              </div>

              {/* Country badge */}
              {university.country&&(
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:12,background:'#fff',border:'1px solid rgba(37,99,235,0.15)',boxShadow:'0 4px 12px -4px rgba(15,23,42,.1)',flexShrink:0,alignSelf:'flex-start'}}>
                  <div style={{width:28,height:28,borderRadius:8,background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',lineHeight:1.25}}>
                    <span style={{fontSize:12.5,fontWeight:700,color:'#0F172A'}}>{university.country}</span>
                    <span style={{fontSize:11,fontWeight:600,color:'#64748B'}}>University</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter + Sort */}
          {sections.length>0&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:20,flexWrap:'wrap',animation:'fadeUp .5s ease .06s backwards'}}>
              <div style={{display:'inline-flex',gap:3,background:'#EEF2F7',borderRadius:12,padding:4}}>
                {tabs.map(t=>(
                  <button key={t.id} onClick={()=>setCat(t.id)} style={{fontSize:13,fontWeight:600,padding:'7px 15px',borderRadius:9,cursor:'pointer',border:'none',whiteSpace:'nowrap',transition:'background .2s,color .2s,box-shadow .2s',background:cat===t.id?'#fff':'transparent',color:cat===t.id?'#0F172A':'#64748B',boxShadow:cat===t.id?'0 1px 3px rgba(15,23,42,.12)':'none'}}>{t.label}</button>
                ))}
              </div>
              <div style={{position:'relative'}}>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{appearance:'none',WebkitAppearance:'none',fontSize:13,fontWeight:600,color:'#475569',background:'#fff',border:'1px solid #E2E8F0',borderRadius:10,padding:'7px 36px 7px 14px',cursor:'pointer',outline:'none',boxShadow:'0 1px 3px rgba(15,23,42,.06)'}}>
                  <option value="default">Default order</option>
                  <option value="progress">By progress</option>
                  <option value="lectures">By lectures</option>
                </select>
                <svg style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}

          {/* Groups */}
          {subjectList.length===0?(
            <div style={{textAlign:'center',padding:'80px 0',color:'#94A3B8',fontSize:14}}>No subjects available yet.</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:36}}>
              {visible.map(section=>(
                <div key={section.key}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,animation:'fadeUp .5s ease .1s backwards'}}>
                    <div style={{width:4,height:18,borderRadius:99,background:section.barColor,flexShrink:0}}/>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:'0.08em',color:'#64748B'}}>{section.label}</div>
                    <div style={{fontSize:12,color:'#94A3B8'}}>· {section.list.length} subjects</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,340px),1fr))',gap:16}}>
                    {section.list.map((s,idx)=>{
                      const cl=getCategoryLabel(s.category)
                      const ac=getAccess(s.access_mode)
                      const sv=saved.has(s.id)
                      return (
                        <Link key={s.id} href={`/${uniSlug}/${s.slug??s.id}`} prefetch={false} style={{textDecoration:'none',display:'block'}}>
                          <div className="mn-card" style={{background:'linear-gradient(135deg,#EFF4FF,#F5F1FF)',border:'1px solid #E2E8F0',borderRadius:18,display:'flex',flexDirection:'column',boxShadow:'0 1px 3px rgba(15,23,42,.04),0 10px 24px -16px rgba(15,23,42,.10)',animation:'fadeUp .5s ease backwards',animationDelay:`${0.05*(idx%6)}s`,height:'100%'}}>
                            <div style={{padding:20,display:'flex',flexDirection:'column',flex:1}}>

                              {/* Badges + Save */}
                              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
                                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                                  <span style={{fontSize:11,fontWeight:700,padding:'4px 9px',borderRadius:7,background:'rgba(22,163,74,0.11)',color:'#16A34A'}}>{cl}</span>
                                  <span style={{fontSize:11,fontWeight:700,padding:'4px 9px',borderRadius:7,background:ac.bg,color:ac.color,display:'inline-flex',alignItems:'center',gap:4}}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                    {ac.label}
                                  </span>
                                </div>
                                {userId&&(
                                  <button className="mn-save" onClick={e=>toggleSave(e,s.id)} style={{display:'inline-flex',alignItems:'center',gap:5,borderRadius:99,padding:'6px 11px',fontSize:11.5,fontWeight:700,cursor:'pointer',border:`1px solid ${sv?'rgba(37,99,235,0.3)':'#E2E8F0'}`,background:sv?'rgba(37,99,235,0.12)':'#fff',color:sv?'#2563EB':'#64748B'}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill={sv?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                    {sv?'Saved':'Save'}
                                  </button>
                                )}
                              </div>

                              <h3 style={{margin:'14px 0 6px',fontSize:18,fontWeight:700,letterSpacing:'-0.01em',color:'#0F172A'}}>{s.name}</h3>
                              <p style={{margin:0,fontSize:13.5,lineHeight:1.55,color:'#64748B',flex:1}}>{s.description??'No description available.'}</p>

                              {/* Stats */}
                              <div style={{display:'flex',gap:20,marginTop:16}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:26,height:26,borderRadius:8,background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>
                                  </div>
                                  <div><div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{s.lecture_count}</div><div style={{fontSize:11,color:'#94A3B8'}}>Lectures</div></div>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:26,height:26,borderRadius:8,background:'rgba(37,99,235,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                  </div>
                                  <div><div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{s.chapter_count}</div><div style={{fontSize:11,color:'#94A3B8'}}>Chapters</div></div>
                                </div>
                              </div>

                              {/* Progress */}
                              <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid rgba(37,99,235,0.12)'}}>
                                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                                  <span style={{fontSize:12.5,fontWeight:600,color:'#475569'}}>Overall Progress</span>
                                  <span style={{fontSize:13,fontWeight:800,color:'#2563EB'}}>{s.progress_pct}%</span>
                                </div>
                                <div style={{height:7,borderRadius:99,background:'#E2E8F0',overflow:'hidden'}}>
                                  <div style={{height:'100%',width:`${s.progress_pct}%`,borderRadius:99,background:'linear-gradient(90deg,#2563EB,#7C3AED)',transition:'width 1.1s cubic-bezier(.22,1,.36,1)'}}/>
                                </div>
                                <div style={{fontSize:11.5,color:'#94A3B8',marginTop:6}}>{s.mastered_count} of {s.lecture_count} lectures mastered</div>
                              </div>

                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
    </>
  )
}
