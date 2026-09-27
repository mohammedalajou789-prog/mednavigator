'use client'
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import StudentModal from '@/components/student/StudentModal'

interface MoreInSubjectButtonProps {
  uniSlug: string
  subjectSlug: string
  subjectName: string
  pyqCount: number
  quizCount: number
  flashCount: number
  videos: { id: string; title: string }[]
  clinicalModules: { id: string; module_type: string }[]
}

const MODULE_LABELS: Record<string, string> = {
  osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam',
}

const CHEVRON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2CADB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 style={{ margin:'22px 0 10px', fontSize:13, fontWeight:800, color:'#55617D' }}>{children}</h3>
}

function Row({ href, iconBg, iconColor, icon, title, desc, badge }: {
  href?: string; iconBg: string; iconColor: string; icon: ReactNode; title: string; desc?: string; badge?: string
}) {
  const inner = (
    <>
      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:11, background:iconBg, color:iconColor, flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1, minWidth:0 }}>
        <span style={{ display:'block', fontSize:14.5, fontWeight:700, color:'#15203A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
        {desc && <span style={{ display:'block', fontSize:12, fontWeight:600, color:'#8892A8', marginTop:1 }}>{desc}</span>}
      </span>
      {badge && <span style={{ fontSize:12, fontWeight:700, color:iconColor, background:iconBg, padding:'4px 9px', borderRadius:8, flexShrink:0 }}>{badge}</span>}
      {href && CHEVRON}
    </>
  )
  const style = { display:'flex', alignItems:'center', gap:12, borderRadius:16, border:'1px solid #E7ECF6', background:'#fff', padding:'12px 16px', minHeight:64, textDecoration:'none', color:'inherit' } as const
  return href
    ? <Link prefetch={false} href={href} className="mis-row" style={style}>{inner}</Link>
    : <div style={style}>{inner}</div>
}

const plural = (n: number, w: string) => `${n} ${w}${n !== 1 ? 's' : ''}`

export default function MoreInSubjectButton({
  uniSlug, subjectSlug, subjectName, pyqCount, quizCount, flashCount, videos, clinicalModules,
}: MoreInSubjectButtonProps) {
  const [open, setOpen] = useState(false)
  const base = `/${uniSlug}/${subjectSlug}`

  return (
    <>
      <style>{`
        .mis-btn { transition:transform .2s ease,box-shadow .2s ease,background .2s ease; }
        .mis-btn:hover { transform:translateY(-2px); background:#1D4ED8 !important; box-shadow:0 12px 22px -12px rgba(37,99,235,.9) !important; }
        .mis-btn:focus-visible, .mis-row:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }
        .mis-row { transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .mis-row:hover { transform:translateX(3px); border-color:#C2D4FF !important; box-shadow:0 14px 26px -20px rgba(40,90,200,.9) !important; }
        @media (prefers-reduced-motion: reduce) { .mis-btn, .mis-row { transition:none; } .mis-btn:hover, .mis-row:hover { transform:none; } }
      `}</style>

      {/* ── Hero button ── */}
      <button
        type="button"
        className="mis-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        style={{ display:'flex', alignItems:'center', gap:10, background:'#2563EB', border:'none', borderRadius:14, padding:'10px 16px', minHeight:54, cursor:'pointer', color:'#fff', font:'inherit', boxShadow:'0 6px 16px rgba(37,99,235,.3)', animation:'fadeUp .5s ease .3s backwards' }}
      >
        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:9, background:'rgba(255,255,255,.18)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </span>
        <span style={{ fontSize:14, fontWeight:700 }}>More in this subject</span>
      </button>

      {/* ── Popup ── */}
      <StudentModal open={open} onClose={() => setOpen(false)} label="More in this subject" maxWidth={520}>
        <div style={{ paddingRight:48 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:'-.02em', color:'#15203A' }}>More in this subject</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, fontWeight:600, color:'#8892A8' }}>{subjectName}</p>
        </div>

        {/* Video Lectures */}
        {videos.length > 0 && (
          <>
            <SectionTitle>Video Lectures</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {videos.map(v => (
                <Row key={v.id} iconBg="#EEF3FF" iconColor="#2F6BFF" title={v.title}
                  icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>} />
              ))}
            </div>
          </>
        )}

        {/* Study Tools */}
        <SectionTitle>Study Tools</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <Row href={`${base}/previous-years`} iconBg="#EEF3FF" iconColor="#2F6BFF" title="Previous Years" desc="Past papers & MCQ bank"
            badge={pyqCount > 0 ? plural(pyqCount, 'question') : undefined}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
          <Row href={`${base}/quiz-bank`} iconBg="#E7F7EF" iconColor="#17A66B" title="Quiz Bank" desc="All quiz questions in one place"
            badge={quizCount > 0 ? plural(quizCount, 'question') : undefined}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
          <Row href={`${base}/flashcards-bank`} iconBg="#FFF6E0" iconColor="#C99400" title="Flashcards Bank" desc="All flashcards in one place"
            badge={flashCount > 0 ? plural(flashCount, 'card') : undefined}
            icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 3h12"/><path d="M4 6h16"/></svg>} />
        </div>

        {/* Clinical Examination (clinical subjects only) */}
        {clinicalModules.length > 0 && (
          <>
            <SectionTitle>OSCE &amp; Oral</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {clinicalModules.map(m => (
                <Row key={m.id} href={`${base}/clinical/${m.id}`} iconBg="#E7F7EF" iconColor="#17A66B"
                  title={MODULE_LABELS[m.module_type] ?? m.module_type} desc="Clinical examination"
                  icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><path d="M16 11V3"/><path d="M8 2v3a4 4 0 0 0 8 0V2"/></svg>} />
              ))}
            </div>
          </>
        )}
      </StudentModal>
    </>
  )
}