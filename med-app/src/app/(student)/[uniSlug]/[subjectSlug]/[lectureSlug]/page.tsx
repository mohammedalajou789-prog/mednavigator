import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    uniSlug: string
    subjectSlug: string
    lectureSlug: string
  }>
}

export default async function LecturePage({ params }: PageProps) {
  const { uniSlug, subjectSlug, lectureSlug } = await params
  redirect(`/${uniSlug}/${subjectSlug}/${lectureSlug}/sheet`)
}
