import Link from 'next/link'
import type { University } from '@/types/database'
import LandingNavbar from '@/components/student/LandingNavbar'
import UniversityCard from '@/components/student/UniversityCard'

async function getActiveUniversities(): Promise<University[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, logo_url, description, is_active, created_at, updated_at, archived_at, country, logo_media_id, cover_media_id, slug')
    .eq('is_active', true)
    .order('name')
  if (error || !data) return []
  return data as any[]
}

const FEATURES = [
  { title: 'Organized by subject', desc: 'Content grouped into structured academic subjects per university.', icon: '☰', iconBg: '#EEF2FF', iconColor: '#4F46E5' },
  { title: 'Progress tracking', desc: 'Track completed lectures and monitor your learning progress visually.', icon: '↗', iconBg: '#F0FDF4', iconColor: '#16A34A' },
  { title: 'Bookmarks & notes', desc: 'Save important content and add personal notes — private to you.', icon: '🔖', iconBg: '#FDF4FF', iconColor: '#7C3AED' },
  { title: 'Previous years bank', desc: 'Access past exam papers organized by year, type, batch, and lecture.', icon: '📄', iconBg: '#FFF7ED', iconColor: '#D97706' },
  { title: 'Clinical resources', desc: 'OSCE cases, checklists, and oral exam prep for clinical students.', icon: '⚕', iconBg: '#FEF2F2', iconColor: '#DC2626' },
  { title: 'Works on all devices', desc: 'Seamless experience on desktop, tablet, and mobile.', icon: '📱', iconBg: '#F0F9FF', iconColor: '#0284C7' },
]

export default async function LandingPage() {
  

  const universities = await getActiveUniversities()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LandingNavbar universities={universities} />

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-4">
            Medical education platform
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-5">
            Your medical education,{' '}
            <span className="text-blue-600">organized.</span>
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-md">
            Lectures, sheets, summaries, flashcards, quizzes, and previous years — all in one structured academic platform. Browse freely, study deeply.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Link
              href="#universities"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Explore universities
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 text-sm font-medium rounded-xl transition-colors"
            >
              Login
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              No account needed to browse — explore as a guest
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hidden lg:block">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-white text-xs font-medium">Heart Failure — Sheet</span>
              <span className="text-blue-400 text-xs">72% read</span>
            </div>
            <div className="grid grid-cols-[80px_1fr]">
              <div className="bg-slate-800 p-3 flex flex-col gap-1.5">
                {['Dashboard', 'Subjects', 'Bookmarks', 'Flashcards', 'Quizzes', 'Progress'].map((item, i) => (
                  <div key={item} className={`text-[9px] px-2 py-1 rounded ${i === 0 ? 'bg-blue-600/20 text-blue-400' : 'text-slateate-400'}`}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-[9px] space-y-2">
                  <div className="font-semibold text-gray-900 dark:text-white text-[10px]">1. Definition</div>
                  <div className="bg-yellow-50 rounded px-2 py-1 text-yellow-800">HF is a syndrome where the heart cannot pump sufficiently.</div>
                  <div className="border-l-2 border-red-500 bg-red-50 rounded-r px-2 py-1 text-red-800">⚠ ACE inhibitors improve survival in HFrEF.</div>
                  <div className="border-l-2 border-green-500 bg-green-50 rounded-r px-2 py-1 text-green-800">Always treat the underlying cause.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2">
          Everything organized around learning
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
          Built for medical students, not marketplaces.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-lg" style={{ background: f.iconBg, color: f.iconColor }}>
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      <section id="universities" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2">
          Available universities
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-10">
          Select your institution and access its organized educational resources.
        </p>
        {universities.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Universities will appear here once added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {universities.map((uni) => (
              <UniversityCard key={uni.id} university={uni} />
            ))}
          </div>
        )}
      </section>

      <footer className="bg-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-white font-semibold text-base">
            Med<span className="text-blue-400">Navigator</span>
          </div>
          <p className="text-slate-400 text-xs">Academic resource platform for medical students</p>
          <p className="text-slate-400 text-xs">© 2026 MedNavigator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}