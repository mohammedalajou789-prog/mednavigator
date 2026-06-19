import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { University, Subject } from '@/types/database'
import SubjectCard from '@/components/student/SubjectCard'
import UniversityHeader from '@/components/student/UniversityHeader'

interface PageProps {
  params: Promise<{ universityId: string }>
}

async function getUniversity(id: string): Promise<University | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('universities').select('*').eq('id', id).eq('is_active', true).single()
  return data ?? null
}

async function getSubjects(universityId: string): Promise<Subject[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('*').eq('university_id', universityId).eq('is_published', true).eq('is_active', true).order('name')
  return data ?? []
}

function SubjectGroup({ title, subjects, universityId }: { title: string; subjects: Subject[]; universityId: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} universityId={universityId} />)}
      </div>
    </div>
  )
}

export default async function UniversityPage({ params }: PageProps) {
  const { universityId } = await params
  const [university, subjects] = await Promise.all([getUniversity(universityId), getSubjects(universityId)])
  if (!university) notFound()

  const preclinical = subjects.filter((s) => s.category === 'preclinical')
  const clinicalMajor = subjects.filter((s) => s.category === 'clinical_major')
  const clinicalMinor = subjects.filter((s) => s.category === 'clinical_minor')
  const uncategorized = subjects.filter((s) => !s.category)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <UniversityHeader university={university} subjectCount={subjects.length} />
      {subjects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">No subjects available yet for this university.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {preclinical.length > 0 && <SubjectGroup title="Pre-Clinical" subjects={preclinical} universityId={universityId} />}
          {clinicalMajor.length > 0 && <SubjectGroup title="Clinical — Major Subjects" subjects={clinicalMajor} universityId={universityId} />}
          {clinicalMinor.length > 0 && <SubjectGroup title="Clinical — Minor Subjects" subjects={clinicalMinor} universityId={universityId} />}
          {uncategorized.length > 0 && <SubjectGroup title="Subjects" subjects={uncategorized} universityId={universityId} />}
        </div>
      )}
    </div>
  )
}