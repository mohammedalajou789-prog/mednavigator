import { createServerClient } from '@/lib/supabase/server'

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'not_subscribed' | 'subscription_expired' | 'subject_not_found' }

/**
 * Checks whether a user has access to a subject's premium content.
 * - If the subject is fully free → always allowed.
 * - If the subject is premium or mixed → requires an active subscription.
 * - If userId is null (guest) and subject is not free → not allowed.
 */
export async function checkUserAccess(
  subjectId: string,
  userId: string | null
): Promise<AccessResult> {
  const supabase = await createServerClient()

  // Step 1: Get the subject's access mode
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id, access_mode, is_free')
    .eq('id', subjectId)
    .single()

  if (subjectError || !subject) {
    return { allowed: false, reason: 'subject_not_found' }
  }

  // Step 2: If the subject is fully free, no subscription needed
  if (subject.access_mode === 'free' || subject.is_free === true) {
    return { allowed: true }
  }

  // Step 3: If no user is logged in and content is not free → block
  if (!userId) {
    return { allowed: false, reason: 'not_subscribed' }
  }

  // Step 4: Check for an active subscription
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
    // On DB error, deny access safely
    return { allowed: false, reason: 'not_subscribed' }
  }

  if (!subscription) {
    return { allowed: false, reason: 'not_subscribed' }
  }

  return { allowed: true }
}

/**
 * Returns the subscription details for a user on a specific subject.
 * Used to show expiry date and days remaining in the student UI.
 */
export async function getUserSubscription(subjectId: string, userId: string) {
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
}

/**
 * Returns all active subscriptions for a user.
 * Used in the student subscriptions dashboard.
 */
export async function getUserSubscriptions(userId: string) {
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
}