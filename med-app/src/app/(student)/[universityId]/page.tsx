import { createClient as createServerClient } from '@/lib/supabase/server'
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
    .select('*')
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-3">
          <Link href="/" className="hover:text-[#2563EB]">Home</Link>
          <span>/</span>
          <span className="text-[#0F172A] font-medium">{university.name}</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">{university.name}</h1>
        <p className="text-sm text-[#64748B] mt-1">{subjects?.length ?? 0} subjects available</p>
      </div>

      {preclinical.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-[#2563EB] rounded-full" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Pre-Clinical</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preclinical.map(subject => (
              <SubjectCard key={subject.id} subject={subject} universityId={universityId} />
            ))}
          </div>
        </section>
      )}

      {clinicalMajor.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-[#7C3AED] rounded-full" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Clinical — Major</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinicalMajor.map(subject => (
              <SubjectCard key={subject.id} subject={subject} universityId={universityId} />
            ))}
          </div>
        </section>
      )}

      {clinicalMinor.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-[#16A34A] rounded-full" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Clinical — Minor</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinicalMinor.map(subject => (
              <SubjectCard key={subject.id} subject={subject} universityId={universityId} />
            ))}
          </div>
        </section>
      )}

      {subjects?.length === 0 && (
        <div className="text-center py-20 text-[#64748B]">
          <p>No subjects available yet.</p>
        </div>
      )}
    </div>
  )
}