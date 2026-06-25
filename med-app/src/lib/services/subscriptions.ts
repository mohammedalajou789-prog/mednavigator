import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'not_subscribed' | 'subscription_expired' | 'subject_not_found' }

export const checkUserAccess = cache(async (
  subjectId: string,
  userId: string | null
): Promise<AccessResult> => {
  const supabase = await createServerClient()

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id, access_mode, is_free')
    .eq('id', subjectId)
    .single()

  if (subjectError || !subject) {
    return { allowed: false, reason: 'subject_not_found' }
  }

  if (subject.access_mode === 'free' || subject.is_free === true) {
    return { allowed: true }
  }

  if (!userId) {
    return { allowed: false, reason: 'not_subscribed' }
  }

  const now = new Date().toISOString()

  const { data: subscription, error: subError } = await supabase
    .from('subject_subscriptions')
    .select('id, status, end_date')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('status', 'active')
    .gt('end_date', now)
    .maybeSingle()

  if (subError) {
    return { allowed: false, reason: 'not_subscribed' }
  }

  if (!subscription) {
    return { allowed: false, reason: 'not_subscribed' }
  }

  return { allowed: true }
})

export const getUserSubscription = cache(async (subjectId: string, userId: string) => {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('subject_subscriptions')
    .select('id, status, start_date, end_date')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data, error }
})

export const getUserSubscriptions = cache(async (userId: string) => {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('subject_subscriptions')
    .select(`
      id,
      status,
      start_date,
      end_date,
      subjects (
        id,
        name,
        universities (
          id,
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('end_date', { ascending: false })

  return { data, error }
})