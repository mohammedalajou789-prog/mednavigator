import { createClient as createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { University } from '@/types/database'
import LandingNavbar from '@/components/student/LandingNavbar'

async function getActiveUniversities(): Promise<University[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, logo_url, description, is_active, created_at, updated_at, archived_at, country, logo_media_id, cover_media_id, slug')
    .eq('is_active', true)
    .order('name')
  if (error || !data) return []
  return data as any[]
}

export default async function LandingPage() {
  const universities = await getActiveUniversities()
  return <LandingPageClient universities={universities} />
}

function LandingPageClient({ universities }: { universities: University[] }) {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(1200px 600px at 78% -6%, #EEF3FF 0%, rgba(238,243,255,0) 60%), #F6F8FC' }}>
      <LandingNavbar universities={universities} />
      <HeroSection />
      <FeaturesSection />
      <UniversitiesSection universities={universities} />
      <FooterSection />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes drift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(24px,-18px) scale(1.08)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-22px,20px) scale(1.06)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(3deg)} 50%{transform:translateY(-13px) rotate(3deg)} }
        @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.7)} }

        .mn-hero { max-width:1200px; margin:0 auto; padding:70px 26px 60px; display:grid; grid-template-columns:1.02fr 1.18fr; gap:56px; align-items:center; width:100%; }
        .mn-mockup { display:block !important; }
        .mn-features { max-width:1200px; margin:0 auto; padding:40px 26px 30px; width:100%; }
        .mn-features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .mn-unis { max-width:1200px; margin:0 auto; padding:56px 26px 30px; width:100%; }

        @media (max-width:900px) {
          .mn-hero { grid-template-columns:1fr; gap:40px; padding:50px 20px 40px; }
          .mn-mockup { display:none !important; }
          .mn-features-grid { grid-template-columns:repeat(2,1fr); }
          .mn-features { padding:32px 20px 24px; }
          .mn-unis { padding:40px 20px 24px; }
          .mn-h1 { font-size:44px !important; }
        }

        @media (max-width:600px) {
          .mn-hero { padding:24px 16px 20px; gap:16px; display:flex !important; flex-direction:column; }
          .mn-mockup { display:none !important; }
          .mn-features-grid { grid-template-columns:1fr !important; gap:10px; }
          .mn-features { padding:24px 16px 16px; }
          .mn-unis { padding:24px 16px 16px; }
          .mn-h1 { font-size:28px !important; line-height:1.1 !important; margin-bottom:12px !important; }
          .mn-hero-p { font-size:13px !important; margin-bottom:18px !important; line-height:1.5 !important; }
          .mn-btns { flex-direction:column !important; gap:10px !important; }
          .mn-btns a, .mn-btns > * { width:100% !important; justify-content:center !important; padding:13px 20px !important; font-size:14px !important; }
          .mn-badge { display:none !important; }
          .mn-feat-h2 { font-size:20px !important; }
          .mn-features { display:none !important; }
          .mn-uni-h2 { font-size:20px !important; }
          .mn-uni-grid { grid-template-columns:1fr !important; }
          .mn-mobile-features { display:flex !important; }
        }
      `}</style>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="mn-hero">
      <div style={{ animation: '0.7s cubic-bezier(0.2,0.7,0.2,1) both fadeUp' }}>
        <div className="mn-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '7px 14px', borderRadius: '999px', background: '#fff', border: '1px solid #E8ECF2', boxShadow: '0 2px 8px rgba(15,23,42,.04)', marginBottom: '24px' }}>
          <span style={{ display: 'flex', width: '7px', height: '7px', borderRadius: '50%', background: '#0EA5A4', boxShadow: '0 0 0 4px rgba(14,165,164,.16)', animation: '2.4s ease-in-out infinite pulseDot' }} />
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', color: '#2563EB', textTransform: 'uppercase' as const }}>Medical education platform</span>
        </div>
        <h1 className="mn-h1" style={{ fontSize: '59px', lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.035em', margin: '0 0 22px', color: '#0F172A' }}>
          Your medical<br />education,<br />
          <span style={{ background: 'linear-gradient(105deg,#2563EB 0%,#6366F1 45%,#7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>organized.</span>
        </h1>
        <p className="mn-hero-p" style={{ fontSize: '17.5px', lineHeight: 1.6, color: '#64748B', margin: '0 0 34px', maxWidth: '440px' }}>
          Lectures, sheets, summaries, flashcards, quizzes, and previous years — every resource, structured around how you actually study.
        </p>
        <div className="mn-btns" style={{ display: 'flex', gap: '13px', marginBottom: '26px' }}>
          <a href="#universities" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '15px 26px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', color: '#fff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px -8px rgba(37,99,235,.55)', textDecoration: 'none' }}>
            Explore universities
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
            </svg>
          </a>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '15px 26px', borderRadius: '14px', border: '1px solid #E8ECF2', background: '#fff', color: '#0F172A', fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Login
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 4px rgba(34,197,94,.16)' }} />
            <span style={{ fontSize: '13px', color: '#64748B' }}>No account needed — explore as a guest</span>
          </div>
          <div style={{ width: '1px', height: '16px', background: '#E8ECF2' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #F6F8FC', background: 'linear-gradient(135deg,#2563EB,#6366F1)', display: 'inline-block' }} />
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #F6F8FC', background: 'linear-gradient(135deg,#0EA5A4,#22D3EE)', display: 'inline-block', marginLeft: '-8px' }} />
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #F6F8FC', background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'inline-block', marginLeft: '-8px' }} />
            </div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>2,400+ students</span>
          </div>
        </div>
      </div>

      {/* Mobile-only feature highlights */}
      <div className="mn-mobile-features" style={{ display: 'none', flexDirection: 'column' as const, gap: '10px', marginTop: '24px' }}>
        {([
          { icon: '📚', title: 'Lectures & Sheets', desc: 'Organized content for every subject' },
          { icon: '🃏', title: 'Flashcards & Quizzes', desc: 'Study smarter with active recall' },
          { icon: '📅', title: 'Previous Years Bank', desc: 'Past papers sorted by year and type' },
          { icon: '📈', title: 'Progress Tracking', desc: 'Track your learning with star ratings' },
        ] as { icon: string; title: string; desc: string }[]).map((f) => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '14px', padding: '14px 16px' }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{f.title}</div>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mockup — hidden on mobile via CSS */}
      <div className="mn-mockup" style={{ position: 'relative', height: '530px', animation: '0.9s ease both fadeIn' }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', left: '8%', top: '2%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,.28),transparent 68%)', filter: 'blur(12px)', animation: '11s ease-in-out infinite drift' }} />
        <div style={{ position: 'absolute', width: '270px', height: '270px', right: '2%', bottom: 0, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,.24),transparent 68%)', filter: 'blur(12px)', animation: '13s ease-in-out infinite drift2' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(37,99,235,.13) 1.1px,transparent 1.1px)', backgroundSize: '22px 22px', WebkitMaskImage: 'radial-gradient(closest-side,black 60%,transparent)', maskImage: 'radial-gradient(closest-side,black 60%,transparent)', opacity: 0.6 }} />

        {/* Main browser mockup */}
        <div style={{ position: 'absolute', left: '1%', top: '3%', width: '98%', borderRadius: '16px', background: '#fff', border: '1px solid #E8ECF2', boxShadow: '0 46px 92px -34px rgba(15,23,42,.46),0 12px 32px -14px rgba(15,23,42,.16)', overflow: 'hidden', animation: '8.5s ease-in-out infinite floatC', zIndex: 2 }}>
          {/* Browser chrome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 13px', background: '#EEF1F6', borderBottom: '1px solid #E2E7EF' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #E2E7EF', borderRadius: '7px', padding: '4px 12px', fontSize: '9px', color: '#94A3B8', maxWidth: '78%', overflow: 'hidden', whiteSpace: 'nowrap' as const }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                mednavigator.app/hashemite/pediatrics/puberty
              </div>
            </div>
          </div>
          {/* App top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 13px', borderBottom: '1px solid #E8ECF2', background: '#fff' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', border: '1px solid #E8ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>
              </svg>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '7px', background: '#F1F4F9', border: '1px solid #E8ECF2', borderRadius: '9px', padding: '6px 11px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
              </svg>
              <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>Search lectures, sheets, quizzes...</span>
            </div>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>A</div>
          </div>
          {/* Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 138px' }}>
            <div style={{ padding: '14px 15px', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#94A3B8', marginBottom: '11px' }}>
                <span>Subjects</span><span>/</span><span>Pediatrics</span><span>/</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Puberty and pubertal disorders</span>
              </div>
              <div style={{ borderRadius: '14px', background: 'linear-gradient(120deg,#EEF3FF,#F4F1FF)', border: '1px solid #E4E9F7', padding: '13px 14px', marginBottom: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563EB,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 14px -5px rgba(37,99,235,.6)' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', lineHeight: 1.15 }}>Puberty and pubertal disorders</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#2563EB' }}>Pediatrics</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', fontWeight: 700, color: '#16A34A', background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: '999px', padding: '3px 8px' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Completed
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', fontWeight: 700, color: '#B45309', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '999px', padding: '3px 8px' }}>
                      &#9733; Free
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '11px', borderLeft: '3px solid #93C5FD', background: 'rgba(255,255,255,.7)', borderRadius: '0 8px 8px 0', padding: '7px 10px', fontSize: '10px', color: '#475569' }}>Dr. Tamara Kufoof</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 11px', borderLeft: '3px solid #2563EB', background: '#F5F8FF', borderRadius: '0 8px 8px 0', marginBottom: '12px' }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '10px', fontWeight: 700, color: '#2563EB' }}>01</span>
                <span style={{ width: '1px', height: '12px', background: '#C7D2FE', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>Normal Puberty &#8212; Definition and Physiology</span>
              </div>
              <div style={{ fontSize: '9.5px', lineHeight: 1.55, color: '#334155', marginBottom: '11px' }}>
                Puberty is the transitional stage from childhood to adulthood, marked by the development of{' '}
                <span style={{ background: '#FEF9C3', padding: '1px 3px', borderRadius: '3px' }}>secondary sexual characteristics</span>.
              </div>
              <div style={{ border: '1px solid #E8ECF2', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', background: '#EFF4FF', padding: '7px 11px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.07em', color: '#2563EB' }}>SEX</span>
                  <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.07em', color: '#2563EB' }}>NORMAL AGE OF PUBERTAL ONSET</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', padding: '7px 11px', borderTop: '1px solid #E8ECF2', fontSize: '9.5px' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Male</span><span style={{ color: '#475569' }}>~14 years</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', padding: '7px 11px', borderTop: '1px solid #E8ECF2', fontSize: '9.5px' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Female</span><span style={{ color: '#475569' }}>~12 years</span>
                </div>
              </div>
              <div style={{ border: '1px solid #BBF7D0', background: '#F0FDF4', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
                  <span style={{ color: '#22C55E', fontSize: '11px' }}>&#9733;</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#15803D' }}>MUST MEMORIZE</span>
                </div>
                <div style={{ fontSize: '9px', lineHeight: 1.55, color: '#166534' }}>
                  <b style={{ color: '#14532D' }}>Menarche</b> &#8212; the first menstrual period.{' '}
                  <b style={{ color: '#14532D' }}>Thelarche</b> &#8212; onset of breast development.
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 11px', background: '#FAFBFE', borderLeft: '1px solid #E8ECF2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.13em', color: '#94A3B8', marginBottom: '4px' }}>CONTENT</div>
              {[{ label: 'Sheet', active: true }, { label: 'Summary', active: false }, { label: 'Flashcards', active: false }, { label: 'Quiz', active: false }, { label: 'Previous Years', active: false }].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 8px', borderRadius: '8px', background: item.active ? '#EAF1FE' : 'transparent', border: item.active ? '1px solid #C7D9FB' : '1px solid transparent' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.active ? '#2563EB' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
                  </svg>
                  <span style={{ flex: 1, fontSize: '9.5px', fontWeight: item.active ? 700 : 600, color: item.active ? '#2563EB' : '#475569' }}>{item.label}</span>
                  {item.active && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6"/>
                    </svg>
                  )}
                </div>
              ))}
              <div style={{ borderTop: '1px solid #E8ECF2', marginTop: '8px', paddingTop: '11px' }}>
                <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.13em', color: '#94A3B8', marginBottom: '9px' }}>READING PROGRESS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', background: 'conic-gradient(#2563EB 0% 72%,#E9EEF6 72% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FAFBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#2563EB' }}>72%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0F172A' }}>Keep reading</div>
                    <div style={{ fontSize: '8.5px', color: '#94A3B8' }}>Almost there</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flashcard widget */}
        <div style={{ position: 'absolute', right: '1%', top: '2%', width: '186px', borderRadius: '16px', background: '#fff', border: '1px solid #E8ECF2', boxShadow: '0 26px 50px -20px rgba(37,99,235,.4)', padding: '15px', animation: '6.5s ease-in-out infinite floatB', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '6px', background: '#EEF2FF', color: '#2563EB' }}>TERM</span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#94A3B8' }}>1 / 70</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.35, color: '#0F172A', marginBottom: '13px' }}>What is the definition of menarche?</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', color: '#94A3B8' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Tap to reveal
          </div>
        </div>

        {/* Quiz passed widget */}
        <div style={{ position: 'absolute', right: '8%', bottom: '15%', display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 15px', borderRadius: '14px', background: 'linear-gradient(135deg,#0EA5A4,#0891B2)', boxShadow: '0 20px 40px -16px rgba(14,165,164,.6)', animation: '5.5s ease-in-out 0.4s infinite floatC', zIndex: 5 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>16 / 16</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.8)' }}>Quiz passed</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section className="mn-features">
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '11px', fontWeight: 600, letterSpacing: '0.16em', color: '#7C3AED', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Built for medical students</div>
        <h2 className="mn-feat-h2" style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#0F172A' }}>Everything organized around learning</h2>
        <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>One structured academic platform — not a marketplace.</p>
      </div>
      <div className="mn-features-grid">
        <FeatureCard title="Organized by subject" desc="Content grouped into structured academic subjects per university." bg="#EEF2FF" color="#4F46E5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </FeatureCard>
        <FeatureCard title="Progress tracking" desc="Track completed lectures and monitor your learning progress visually." bg="#ECFDF5" color="#16A34A">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
        </FeatureCard>
        <FeatureCard title="Bookmarks & notes" desc="Save important content and add personal notes — private to you." bg="#FDF4FF" color="#9333EA">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </FeatureCard>
        <FeatureCard title="Previous years bank" desc="Access past exam papers organized by year, type, batch, and lecture." bg="#FFF7ED" color="#D97706">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>
          </svg>
        </FeatureCard>
        <FeatureCard title="Clinical resources" desc="OSCE cases, checklists, and oral exam prep for clinical students." bg="#FEF2F2" color="#DC2626">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
          </svg>
        </FeatureCard>
        <FeatureCard title="Works on all devices" desc="Seamless experience on desktop, tablet, and mobile." bg="#EFF6FF" color="#0284C7">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M11 18h2"/>
          </svg>
        </FeatureCard>
      </div>
    </section>
  )
}

function FeatureCard({ title, desc, bg, color, children }: { title: string; desc: string; bg: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', background: '#fff', border: '1px solid #E8ECF2', borderRadius: '18px', padding: '26px 24px', overflow: 'hidden' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', background: bg, color }}>
        {children}
      </div>
      <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em', color: '#0F172A' }}>{title}</h3>
      <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: '#64748B', margin: 0 }}>{desc}</p>
      <div style={{ position: 'absolute', right: '-30px', bottom: '-30px', width: '90px', height: '90px', borderRadius: '50%', background: bg, opacity: 0.5, filter: 'blur(8px)' }} />
    </div>
  )
}

function UniversitiesSection({ universities }: { universities: University[] }) {
  return (
    <section id="universities" className="mn-unis">
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 className="mn-uni-h2" style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px', color: '#0F172A' }}>Available universities</h2>
        <p style={{ fontSize: '15.5px', color: '#64748B', margin: 0 }}>Select your institution and access its organized educational resources.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '18px', maxWidth: '840px', margin: '0 auto' }}>
        {universities.length === 0 ? (
          <div style={{ borderRadius: '18px', border: '1.5px dashed #CBD5E1', padding: '48px 24px', textAlign: 'center', color: '#94A3B8', gridColumn: '1/-1' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>Universities will appear here once added.</p>
          </div>
        ) : (
          universities.map((uni) => (
            <Link key={uni.id} href={`/${(uni as any).slug ?? uni.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1px solid #E8ECF2', borderRadius: '18px', padding: '28px 24px 20px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: '74px', height: '74px', borderRadius: '50%', margin: '0 auto 16px', background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border: '1px solid #E8ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uni.logo_url
                    ? <img src={uni.logo_url} alt={uni.name} style={{ width: '66px', height: '66px', borderRadius: '50%', objectFit: 'cover' }} />
                    : (
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5"/>
                      </svg>
                    )
                  }
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>{uni.name}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748B', marginBottom: '18px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  Resources available
                </div>
                <div style={{ borderTop: '1px solid #E8ECF2', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#2563EB' }}>
                  BROWSE SUBJECTS
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
        <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: '18px', padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94A3B8' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#64748B' }}>More coming soon</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Request your university at signup</div>
        </div>
      </div>
    </section>
  )
}

function FooterSection() {
  return (
    <footer style={{ marginTop: '64px', background: 'linear-gradient(120deg,#0D1B2A,#12223A)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '34px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="16" stroke="#CFE0F5" strokeWidth="2.6"/>
            <path d="M5 24 H16 l2 -5 l3 10 l2 -5 H43" stroke="#CFE0F5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M24 6 V24" stroke="#CFE0F5" strokeWidth="2.6" strokeLinecap="round"/>
            <path d="M24 24 V42" stroke="#5AA0FF" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Med<span style={{ color: '#60A5FA' }}>Navigator</span></span>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>Academic resource platform for medical students</p>
        <p style={{ color: '#64748B', fontSize: '12.5px', margin: 0 }}>&#169; 2026 MedNavigator. All rights reserved.</p>
      </div>
    </footer>
  )
}