import { createServerClient } from '@/lib/supabase/server'
import type { SubSubject } from '@/types/database'

export interface CreateSubSubjectInput {
  subject_id: string
  title: string
  description?: string
  display_order?: number
}

export interface UpdateSubSubjectInput {
  title?: string
  description?: string
  display_order?: number
}

export async function getSubSubjectsBySubject(subjectId: string): Promise<{ data: SubSubject[] | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sub_subjects')
    .select('*')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  return { data, error }
}

export async function getSubSubjectById(id: string): Promise<{ data: SubSubject | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sub_subjects')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getNextSubSubjectOrder(subjectId: string): Promise<number> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('sub_subjects')
    .select('display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()
  return data ? (data.display_order ?? 0) + 1 : 0
}

export async function createSubSubject(input: CreateSubSubjectInput): Promise<{ data: SubSubject | null; error: unknown }> {
  const supabase = await createServerClient()
  const order = input.display_order ?? (await getNextSubSubjectOrder(input.subject_id))
  const { data, error } = await supabase
    .from('sub_subjects')
    .insert({
      subject_id: input.subject_id,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      display_order: order,
    })
    .select()
    .single()
  return { data, error }
}

export async function updateSubSubject(
  id: string,
  input: UpdateSubSubjectInput
): Promise<{ data: SubSubject | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('sub_subjects')
    .update({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.display_order !== undefined && { display_order: input.display_order }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function archiveSubSubject(id: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('sub_subjects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  return { error }
}

export async function restoreSubSubject(id: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('sub_subjects')
    .update({ archived_at: null })
    .eq('id', id)
  return { error }
}