import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SubjectCard from '@/components/student/SubjectCard'

interface PageProps {
  params: Promise<{ universityId: string }>
}

export default async function UniversityPage({ params }: PageProps) {
  const { universityId } = await params
  const supabase = await createServerClient()

  const { data: university } = await supabase
    .from('universities')
    .select('id, name, logo_url, is_active')
    .eq('id', universityId)
    .eq('is_active', true)
    .single()

  if (!university) notFound()

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('university_id', universityId)
    .eq('is_published', true)
    .eq('is_active', true)
    .order('name')

  const preclinical = subjects?.filter(s => s.category === 'preclinical') ?? []
  const clinicalMajor = subjects?.filter(s => s.category === 'clinical_major') ?? []
  const clinicalMinor = subjects?.filter(s => s.category === 'clinical_minor') ?? []

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 mb-6">
        <Link href="/home" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">{university.name}</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {university.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{university.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {subjects?.length ?? 0} {subjects?.length === 1 ? 'subject' : 'subjects'} available
          </p>
        </div>
      </div>

      {subjects?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-16 text-center">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No subjects available yet</p>
        </div>
      ) : (
        <div className="space-y-10">
          {preclinical.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-blue-600 rounded-full" />
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pre-Clinical</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{preclinical.length} subjects</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preclinical.map(subject => (
                  <SubjectCard key={subject.id} subject={subject} universityId={universityId} />
                ))}
              </div>
            </section>
          )}

          {clinicalMajor.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-purple-600 rounded-full" />
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Clinical — Major</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{clinicalMajor.length} subjects</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinicalMajor.map(subject => (
                  <SubjectCard key={subject.id} subject={subject} universityId={universityId} />
                ))}
              </div>
            </section>
          )}

          {clinicalMinor.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-teal-600 rounded-full" />
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Clinical — Minor</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{clinicalMinor.length} subjects</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinicalMinor.map(subject => (
                  <SubjectCard key={subject.id} subject={subject} universityId={universityId} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}