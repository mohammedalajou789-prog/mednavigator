import Link from 'next/link'

const faqs = [
  { q: 'How do I access premium subjects?', a: 'Premium subjects require a subscription. Contact your university admin or support via WhatsApp to activate access.' },
  { q: 'Can I use MedNavigator on multiple devices?', a: 'Each account is linked to one device at a time. To switch devices, contact support to reset your device.' },
  { q: 'How do I track my progress?', a: 'Your progress is tracked automatically as you read sheets and complete quizzes. Visit My Progress from the sidebar.' },
  { q: 'What is the difference between Sheet and Summary?', a: 'A Sheet is the full detailed content for a lecture. A Summary is a condensed version of the same content.' },
  { q: 'How do I bookmark a lecture?', a: 'Open any lecture and click the bookmark icon in the top bar. All bookmarks are saved in the Bookmarks page.' },
  { q: 'My university is not listed. What do I do?', a: 'During registration, select "My university is not listed" and submit a request. The platform owner will review it.' },
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
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Help Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Guides and support resources for using MedNavigator.</p>
      </div>
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Need help? Contact Support</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">For device resets, subscription issues, or technical problems.</p>
        <a href="https://wa.me/962799999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">WhatsApp Support</a>
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guides.map((g) => (
            <div key={g.title} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{g.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{faq.q}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
      <Link href="/home" className="inline-flex text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Dashboard</Link>
    </div>
  )
}