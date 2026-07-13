import { createServerClient } from '@/lib/supabase/server'
import type { Chapter } from '@/types/database'

export interface CreateChapterInput {
  subject_id: string
  title: string
  description?: string
  display_order?: number
  slug?: string
}

export interface UpdateChapterInput {
  title?: string
  description?: string
  display_order?: number
  slug?: string
}

export async function getChaptersBySubject(subjectId: string): Promise<{ data: Chapter[] | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  return { data, error }
}

export async function getChapterById(chapterId: string): Promise<{ data: Chapter | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single()
  return { data, error }
}

export async function getNextChapterOrder(subjectId: string): Promise<number> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('chapters')
    .select('display_order')
    .eq('subject_id', subjectId)
    .is('archived_at', null)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()
  return data ? (data.display_order ?? 0) + 1 : 0
}

export async function createChapter(input: CreateChapterInput): Promise<{ data: Chapter | null; error: unknown }> {
  const supabase = await createServerClient()
  const order = input.display_order ?? (await getNextChapterOrder(input.subject_id))
  const { data, error } = await supabase
    .from('chapters')
    .insert({
      subject_id: input.subject_id,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      display_order: order,
      ...(input.slug && { slug: input.slug }),
    } as any)
    .select()
    .single()
  return { data, error }
}

export async function updateChapter(
  chapterId: string,
  input: UpdateChapterInput
): Promise<{ data: Chapter | null; error: unknown }> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('chapters')
    .update({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.display_order !== undefined && { display_order: input.display_order }),
      ...(input.slug !== undefined && { slug: input.slug }),
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', chapterId)
    .select()
    .single()
  return { data, error }
}

export async function publishChapter(chapterId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('chapters')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chapterId)
  return { error }
}

export async function unpublishChapter(chapterId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('chapters')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chapterId)
  return { error }
}

export async function archiveChapter(chapterId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('chapters')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', chapterId)
  return { error }
}

export async function restoreChapter(chapterId: string): Promise<{ error: unknown }> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('chapters')
    .update({ archived_at: null })
    .eq('id', chapterId)
  return { error }
}