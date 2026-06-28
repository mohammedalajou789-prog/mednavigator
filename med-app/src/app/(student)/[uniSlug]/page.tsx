import { createClient as createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ uniSlug: string }>
}

export default async function UniversityPage({ params }: PageProps) {
  const { uniSlug } = await params

  const supabase = await createServerClient()

  // resolve slug → university
  const { data: university } = await supabase
    .from('universities')
    .select('id, name, logo_url')
    .eq('slug' as any, uniSlug)
    .single()

  if (!university) notFound()

  // fetch all published subjects for this university
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, subject_type, category, access_mode, description')
    .eq('university_id', university.id)
    .eq('is_published', true)
    .order('name') as any

  const subjectList = (subjects ?? []) as Array<{
    id: string
    name: string
    subject_type: string
    category: string | null
    access_mode: string
    description: string | null
  }>

  // group by category
  const preclinical   = subjectList.filter(s => s.category === 'preclinical')
  const clinicalMajor = subjectList.filter(s => s.category === 'clinical_major')
  const clinicalMinor = subjectList.filter(s => s.category === 'clinical_minor')
  const other         = subjectList.filter(s => !['preclinical','clinical_major','clinical_minor'].includes(s.category ?? ''))

  const sections = [
    { key: 'preclinical',    label: 'Pre-Clinical',     list: preclinical,   color: 'bg-blue-600' },
    { key: 'clinical_major', label: 'Clinical — Major', list: clinicalMajor, color: 'bg-violet-600' },
    { key: 'clinical_minor', label: 'Clinical — Minor', list: clinicalMinor, color: 'bg-teal-600' },
    { key: 'other',          label: 'General',          list: other,         color: 'bg-slate-500' },
  ].filter(s => s.list.length > 0)

  const typeColor: Record<string, { text: string; bg: string; dot: string }> = {
    standard: { text: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/30',     dot: 'bg-blue-500' },
    system:   { text: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', dot: 'bg-violet-500' },
    clinical: { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', dot: 'bg-emerald-500' },
  }

  const accessColor: Record<string, { text: string; bg: string }> = {
    free:    { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    mixed:   { text: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/30' },
    premium: { text: 'text-rose-700 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/30' },
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <main className="max-w-screen-xl mx-auto px-6 py-8 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-slate-400 mb-6">
          <Link href="/home" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Home
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-700 dark:text-slate-200 font-semibold">{university.name}</span>
        </nav>

        {/* University Header */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-7 mb-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              {university.logo_url ? (
                <img src={university.logo_url} alt={university.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[22px] font-bold text-white">
                  {university.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                {university.name}
              </h1>
              <p className="text-[14px] text-slate-400">
                {subjectList.length} {subjectList.length === 1 ? 'subject' : 'subjects'} available
              </p>
            </div>
          </div>
        </section>

        {/* Subjects */}
        {subjectList.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-[14px]">
            No subjects available yet.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {sections.map(section => (
              <div key={section.key}>
                {/* category header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-1 h-5 rounded-full ${section.color}`} />
                  <h2 className="text-[13px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    {section.label}
                  </h2>
                  <span className="text-[12px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                    {section.list.length}
                  </span>
                </div>

                {/* subject cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.list.map(subject => {
                    const typeStyle   = typeColor[subject.subject_type]  ?? typeColor.standard
                    const accessStyle = accessColor[subject.access_mode] ?? accessColor.free
                    const isLocked    = subject.access_mode === 'premium'

                    const typeLabel   = subject.subject_type === 'system'   ? 'System'
                      : subject.subject_type === 'clinical' ? 'Clinical' : 'Standard'
                    const accessLabel = subject.access_mode === 'premium'   ? 'Premium'
                      : subject.access_mode === 'mixed'    ? 'Mixed'    : 'Free'

                    return (
                      <Link
                        key={subject.id}
                        href={`/${uniSlug}/${subject.id}`}
                        className="no-underline block group"
                      >
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm h-full flex flex-col gap-4 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:shadow-md transition-all duration-150">

                          {/* badges row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${typeStyle.text} ${typeStyle.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                              {typeLabel}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${accessStyle.text} ${accessStyle.bg}`}>
                              {isLocked && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                              )}
                              {accessLabel}
                            </span>
                          </div>

                          {/* subject name */}
                          <div className="flex-1">
                            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug mb-1.5">
                              {subject.name}
                            </h3>
                            {subject.description && (
                              <p className="text-[12.5px] text-slate-400 leading-relaxed line-clamp-2">
                                {subject.description}
                              </p>
                            )}
                          </div>

                          {/* arrow */}
                          <div className="flex items-center justify-end">
                            <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 flex items-center gap-1 transition-all">
                              Open subject
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 6l6 6-6 6"/>
                              </svg>
                            </span>
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
    </div>
  )
}