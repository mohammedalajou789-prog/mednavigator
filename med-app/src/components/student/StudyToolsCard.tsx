'use client'
import { useState } from 'react'
import Link from 'next/link'
import StudentModal from '@/components/student/StudentModal'

interface StudyToolsCardProps {
  uniSlug: string
  subjectSlug: string
  subjectName: string
  pyqCount: number
  quizCount: number
  flashCount: number
}

export default function StudyToolsCard({ uniSlug, subjectSlug, subjectName, pyqCount, quizCount, flashCount }: StudyToolsCardProps) {
  const [open, setOpen] = useState(false)

  const tools = [
    {
      key: 'pyq',
      title: 'Previous Years',
      desc: 'Past papers & MCQ bank',
      href: `/${uniSlug}/${subjectSlug}/previous-years`,
      count: pyqCount,
      unit: 'question',
      iconBg: '#EEF3FF', iconColor: '#2F6BFF',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      key: 'quiz',
      title: 'Quiz Bank',
      desc: 'All quiz questions in one place',
      href: `/${uniSlug}/${subjectSlug}/quiz-bank`,
      count: quizCount,
      unit: 'question',
      iconBg: '#E7F7EF', iconColor: '#17A66B',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
    {
      key: 'flash',
      title: 'Flashcards Bank',
      desc: 'All flashcards in one place',
      href: `/${uniSlug}/${subjectSlug}/flashcards-bank`,
      count: flashCount,
      unit: 'card',
      iconBg: '#FFF6E0', iconColor: '#C99400',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 3h12"/><path d="M4 6h16"/></svg>,
    },
  ]

  return (
    <>
      <style>{`
        .st-card { transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .st-card:hover { transform:translateX(4px); border-color:#C2D4FF !important; box-shadow:0 16px 30px -22px rgba(40,90,200,.9) !important; }
        .st-card:focus-visible, .st-row:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }
        .st-row { transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .st-row:hover { transform:translateX(3px); border-color:#C2D4FF !important; box-shadow:0 14px 26px -20px rgba(40,90,200,.9) !important; }
        @media (prefers-reduced-motion: reduce) { .st-card, .st-row { transition:none; } .st-card:hover, .st-row:hover { transform:none; } }
      `}</style>

      {/* ── Sidebar card ── */}
      <button
        type="button"
        className="st-card"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'14px 16px', marginBottom:10, cursor:'pointer', textAlign:'left', font:'inherit', color:'inherit', animation:'fadeUp .5s ease .48s backwards' }}
      >
        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:11, background:'#EEF3FF', color:'#2F6BFF', flexShrink:0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </span>
        <span style={{ flex:1, minWidth:0 }}>
          <span style={{ display:'block', fontSize:14, fontWeight:700, color:'#15203A' }}>Study Tools</span>
          <span style={{ display:'block', fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>Previous years, quizzes & flashcards</span>
        </span>
        <span style={{ display:'flex', gap:4, flexShrink:0 }} aria-hidden="true">
          {tools.map(t => <span key={t.key} style={{ width:7, height:7, borderRadius:'50%', background:t.iconColor }} />)}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* ── Popup ── */}
      <StudentModal open={open} onClose={() => setOpen(false)} label="Study tools" maxWidth={480}>
        <div style={{ paddingRight:48 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:'-.02em', color:'#15203A' }}>Study Tools</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, fontWeight:600, color:'#8892A8' }}>Practice across all of {subjectName}</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:18 }}>
          {tools.map(t => (
            <Link
              key={t.key}
              prefetch={false}
              href={t.href}
              className="st-row"
              style={{ display:'flex', alignItems:'center', gap:12, borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'14px 16px', textDecoration:'none', color:'inherit' }}
            >
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:11, background:t.iconBg, color:t.iconColor, flexShrink:0 }}>
                {t.icon}
              </span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:'block', fontSize:14.5, fontWeight:700, color:'#15203A' }}>{t.title}</span>
                <span style={{ display:'block', fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>{t.desc}</span>
              </span>
              {t.count > 0 && (
                <span style={{ fontSize:12, fontWeight:700, color:t.iconColor, background:t.iconBg, padding:'4px 9px', borderRadius:8, flexShrink:0 }}>
                  {t.count} {t.unit}{t.count !== 1 ? 's' : ''}
                </span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          ))}
        </div>
      </StudentModal>
    </>
  )
}