import Link from 'next/link'

const faqs = [
  { q: 'How do I access premium subjects?', a: 'Premium subjects require a subscription. Contact your university admin or support via WhatsApp to activate access.' },
  { q: 'Can I use MedNavigator on multiple devices?', a: 'Each account is linked to one device at a time. To switch devices, contact support to reset your device.' },
  { q: 'How do I track my progress?', a: 'Your progress is tracked automatically as you read sheets and complete quizzes. Visit My Progress from the sidebar.' },
  { q: 'What is the difference between Sheet and Summary?', a: 'A Sheet is the full detailed content for a lecture. A Summary is a condensed version of the same content.' },
  { q: 'How do I bookmark a lecture?', a: 'Open any lecture and click the bookmark icon in the top bar. All bookmarks are saved in the Bookmarks page.' },
]

const guides = [
  { title: 'Reading Sheets', desc: 'How to read, track progress, and use the table of contents.' },
  { title: 'Using Flashcards', desc: 'Flip cards, rate difficulty, and build memory efficiently.' },
  { title: 'Taking Quizzes', desc: 'Navigate questions, submit answers, and review your score.' },
  { title: 'Previous Years', desc: 'Filter by year and type to practice past exam questions.' },
  { title: 'Bookmarks and Notes', desc: 'Save important content and write personal notes per lecture.' },
  { title: 'Progress Tracking', desc: 'Monitor your reading progress and completed lectures.' },
]

export default function HelpPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>Help Center</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)' }}>Guides and support resources for using MedNavigator.</p>
        </div>

        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 18, padding: '22px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--ink)' }}>Need help? Contact Support</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 16 }}>For device resets, subscription issues, or technical problems.</div>
          <a href="https://wa.me/962799999999" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 20px', borderRadius: 12, background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            WhatsApp Support
          </a>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Quick Guides</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
            {guides.map((g) => (
              <div key={g.title} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--ink)' }}>{g.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: 'var(--ink)' }}>{faq.q}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/home" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
          Back to Dashboard
        </Link>

      </div>
    </div>
  )
}