'use client'
import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import SubjectDialog from '@/components/student/SubjectDialog'

interface MoreInSubjectButtonProps {
  uniSlug: string
  subjectSlug: string
  subjectName: string
  pyqCount: number
  quizCount: number
  flashCount: number
  videos: { id: string; title: string; isPreview?: boolean }[]
  clinicalModules: { id: string; module_type: string }[]
}

const MODULE_LABELS: Record<string, string> = {
  osce: 'OSCE Stations', mini_osce: 'Mini-OSCE', oral_exam: 'Oral Exam',
}

const plural = (n: number, w: string) => `${n} ${w}${n !== 1 ? 's' : ''}`

const ICONS = {
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  calendar: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  quiz: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  cards: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>,
  play: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20 7 4"/></svg>,
  stethoscope: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>,
  mic: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4BECE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>,
}

function ToolRow({ href, iconBg, iconColor, badgeColor, icon, title, desc, badge }: {
  href: string; iconBg: string; iconColor: string; badgeColor: string; icon: ReactNode; title: string; desc: string; badge?: string
}) {
  return (
    <Link prefetch={false} href={href} className="mis-row">
      <span className="mis-icon" style={{ background:iconBg, color:iconColor }}>{icon}</span>
      <span className="mis-text">
        <span className="mis-title">{title}</span>
        <span className="mis-desc">{desc}</span>
      </span>
      {badge && <span className="mis-badge" style={{ background:iconBg, color:badgeColor }}>{badge}</span>}
      {ICONS.chevron}
    </Link>
  )
}

export default function MoreInSubjectButton({
  uniSlug, subjectSlug, subjectName, pyqCount, quizCount, flashCount, videos, clinicalModules,
}: MoreInSubjectButtonProps) {
  const [open, setOpen] = useState(false)
  const base = `/${uniSlug}/${subjectSlug}`

  const subtitle = [
    videos.length > 0 ? 'Videos' : null,
    'Question banks',
    clinicalModules.length > 0 ? 'OSCE' : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <style>{`
        .mis-btn { display:flex; align-items:center; gap:12px; min-height:56px; padding:10px 16px 10px 12px; border:none; border-radius:14px;
          background:#2563EB; color:#fff; font:inherit; text-align:left; cursor:pointer; box-shadow:0 6px 16px rgba(37,99,235,.3);
          transition:transform .2s ease,box-shadow .2s ease,background .2s ease; animation:spFadeUp .5s ease .3s backwards; }
        .mis-btn:active { transform:scale(.98); }
        .mis-btn:focus-visible { outline:2px solid #2F6BFF; outline-offset:3px; }
        .mis-btn-icon { width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mis-btn-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
        .mis-btn-title { font-size:14px; font-weight:700; }
        .mis-btn-sub { font-size:11.5px; font-weight:600; color:#E6EEFF; }

        .mis-h2 { margin:0; padding-right:52px; font-size:20px; font-weight:800; letter-spacing:-.02em; color:#15203A; }
        .mis-sub { margin:4px 0 0; font-size:13px; font-weight:600; color:#6B7690; }
        .mis-section { margin:18px 4px 10px; font-size:11.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#55617D; }
        .mis-section:first-child { margin-top:6px; }
        .mis-list { display:flex; flex-direction:column; gap:8px; }
        .mis-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }

        .mis-row { display:flex; align-items:center; gap:12px; min-height:62px; box-sizing:border-box; padding:10px 14px 10px 12px;
          border-radius:16px; border:1px solid #E7ECF6; background:#fff; text-decoration:none; color:inherit;
          transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
        .mis-row:focus-visible { outline:2px solid #2F6BFF; outline-offset:2px; }
        .mis-row:active { transform:scale(.99); }
        .mis-icon { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mis-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
        .mis-title { font-size:14.5px; font-weight:700; color:#15203A; line-height:1.3; }
        .mis-desc { font-size:12px; font-weight:600; color:#6B7690; }
        .mis-badge { flex-shrink:0; padding:4px 9px; border-radius:8px; font-size:12px; font-weight:700; white-space:nowrap; }
        .mis-thumb { width:52px; height:38px; border-radius:10px; background:#EEF3FF; color:#2F6BFF; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mis-preview { flex-shrink:0; padding:3px 8px; border-radius:7px; background:#E7F7EF; color:#138A5A; font-size:11px; font-weight:800; }

        @media (min-width:640px) {
          .mis-h2 { font-size:22px; }
          .mis-section { margin-top:22px; font-size:12px; }
        }
        @media (hover:hover) {
          .mis-btn:hover { transform:translateY(-2px); background:#1D4ED8; box-shadow:0 12px 22px -12px rgba(37,99,235,.9); }
          .mis-row:hover { transform:translateX(3px); border-color:#C2D4FF; box-shadow:0 14px 26px -20px rgba(40,90,200,.9); }
        }
        @media (prefers-reduced-motion: reduce) { .mis-btn, .mis-row { transition:none; animation:none; } }
      `}</style>

      {/* ── Hero button ── */}
      <button type="button" className="mis-btn sp-more-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span className="mis-btn-icon">{ICONS.grid}</span>
        <span className="mis-btn-text">
          <span className="mis-btn-title">More in this subject</span>
          <span className="mis-btn-sub">{subtitle}</span>
        </span>
      </button>

      {/* ── Popup ── */}
      <SubjectDialog
        open={open}
        onClose={() => setOpen(false)}
        label="More in this subject"
        maxWidth={560}
        header={
          <>
            <h2 className="mis-h2">More in this subject</h2>
            <p className="mis-sub">{subjectName}</p>
          </>
        }
      >
        {/* Study Tools */}
        <h3 className="mis-section">Study tools</h3>
        <div className="mis-list">
          <ToolRow href={`${base}/previous-years`} iconBg="#EEF3FF" iconColor="#2F6BFF" badgeColor="#2456D6"
            title="Previous Years" desc="Past papers & MCQ bank" icon={ICONS.calendar}
            badge={pyqCount > 0 ? plural(pyqCount, 'question') : undefined} />
          <ToolRow href={`${base}/quiz-bank`} iconBg="#E7F7EF" iconColor="#138A5A" badgeColor="#138A5A"
            title="Quiz Bank" desc="All quiz questions in one place" icon={ICONS.quiz}
            badge={quizCount > 0 ? plural(quizCount, 'question') : undefined} />
          <ToolRow href={`${base}/flashcards-bank`} iconBg="#FFF6E0" iconColor="#C99400" badgeColor="#A1730A"
            title="Flashcards Bank" desc="All flashcards in one place" icon={ICONS.cards}
            badge={flashCount > 0 ? plural(flashCount, 'card') : undefined} />
        </div>

        {/* Video Lectures */}
        {videos.length > 0 && (
          <>
            <h3 className="mis-section">Video lectures</h3>
            <div className="mis-list">
              {videos.map(v => (
                <div key={v.id} className="mis-row" style={{ cursor:'default' }}>
                  <span className="mis-thumb">{ICONS.play}</span>
                  <span className="mis-text"><span className="mis-title">{v.title}</span></span>
                  {v.isPreview && <span className="mis-preview">Free preview</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Clinical Examination (clinical subjects only) */}
        {clinicalModules.length > 0 && (
          <>
            <h3 className="mis-section">OSCE &amp; Oral</h3>
            <div className="mis-grid">
              {clinicalModules.map(m => (
                <Link key={m.id} prefetch={false} href={`${base}/clinical/${m.id}`} className="mis-row">
                  <span className="mis-icon" style={{ background:'#E7F7EF', color:'#138A5A' }}>
                    {m.module_type === 'oral_exam' ? ICONS.mic : ICONS.stethoscope}
                  </span>
                  <span className="mis-text">
                    <span className="mis-title">{MODULE_LABELS[m.module_type] ?? m.module_type}</span>
                    <span className="mis-desc">Clinical exam</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </SubjectDialog>
    </>
  )
}