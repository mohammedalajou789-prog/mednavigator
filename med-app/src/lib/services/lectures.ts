import { createServerClient } from '@/lib/supabase/server'
import type { Lecture } from '@/types/database'

export interface LectureWithContent extends Lecture {
  chapters?: { title: string } | null
  sub_subjects?: { title: string } | null
}

export interface CreateLectureInput {
  subject_id: string
  chapter_id?: string
  sub_subject_id?: string
  title: string
  description?: string
  is_preview?: boolean
  display_order?: number
}

export interface UpdateLectureInput {
  title?: string
  description?: string
  status?: 'draft' | 'published' | 'archived'
  is_preview?: boolean
  display_order?: number
}

export async function getLecturesByChapter(chapterId: string): Promise<{ data: Lecture[] | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('chapter_id', chapterId)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  return { data, error }
}

export async function getLecturesBySubSubject(subSubjectId: string): Promise<{ data: Lecture[] | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('sub_subject_id', subSubjectId)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  return { data, error }
}

export async function getLecturesBySubject(subjectId: string): Promise<{ data: LectureWithContent[] | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('lectures')
    .select(`*, chapters ( title ), sub_subjects ( title )`)
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  return { data, error }
}

export async function getLectureById(lectureId: string): Promise<{ data: Lecture | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', lectureId)
    .single()
  return { data, error }
}

export async function getNextLectureOrder(
  chapterId?: string,
  subSubjectId?: string
): Promise<number> {
  const supabase = await createServerClient()
  let query = supabase
    .from('lectures')
    .select('display_order')
    .is('archived_at', null)
    .order('display_order', { ascending: false })
    .limit(1)

  if (chapterId) query = query.eq('chapter_id', chapterId)
  else if (subSubjectId) query = query.eq('sub_subject_id', subSubjectId)

  const { data } = await query.single()
  return data ? (data.display_order ?? 0) + 1 : 0
}

export async function createLecture(input: CreateLectureInput): Promise<{ data: Lecture | null; error: unknown }> {
  const supabase = await createServerClient()
  const order = input.display_order ?? (await getNextLectureOrder(input.chapter_id, input.sub_subject_id))
  const { data, error } = await supabase
    .from('lectures')
    .insert({
      subject_id: input.subject_id,
      chapter_id: input.chapter_id ?? null,
      sub_subject_id: input.sub_subject_id ?? null,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      status: 'draft',
      is_preview: input.is_preview ?? false,
      display_order: order,
    })
    .select()
    .single()
  return { data, error }
}

export async function updateLecture(
  lectureId: string,
  input: UpdateLectureInput
): Promise<{ data: Lecture | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('lectures')
    .update({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.is_preview !== undefined && { is_preview: input.is_preview }),
      ...(input.display_order !== undefined && { display_order: input.display_order }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lectureId)
    .select()
    .single()
  return { data, error }
}

export async function publishLecture(lectureId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('lectures')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', lectureId)
  return { error }
}

export async function archiveLecture(lectureId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('lectures')
    .update({ archived_at: new Date().toISOString(), status: 'archived' })
    .eq('id', lectureId)
  return { error }
}

export async function restoreLecture(lectureId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('lectures')
    .update({ archived_at: null, status: 'draft' })
    .eq('id', lectureId)
  return { error }
}