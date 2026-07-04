import { createClient } from '@/lib/supabase/client'

// ─── Core insert function ─────────────────────────────────────────────────────

async function insertNotification(payload: {
  title: string
  message: string
  notification_source: string
  target_type: 'all' | 'university' | 'subject' | 'user'
  priority?: 'normal' | 'important' | 'critical'
  university_id?: string | null
  subject_id?: string | null
  user_id?: string | null
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title: payload.title,
      message: payload.message,
      notification_source: payload.notification_source,
      target_type: payload.target_type,
      priority: payload.priority ?? 'normal',
      university_id: payload.university_id ?? null,
      subject_id: payload.subject_id ?? null,
      user_id: payload.user_id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[notifications] insert error:', error.message)
    return null
  }
  return data?.id ?? null
}

// ─── 1. New Subscription (student) ───────────────────────────────────────────

export async function notifySubscriptionGranted(params: {
  userId: string
  subjectName: string
  endDate: string
}) {
  const expiry = new Date(params.endDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return insertNotification({
    title: `Subscription Activated — ${params.subjectName}`,
    message: `You have been granted access to ${params.subjectName}. Your subscription is active until ${expiry}.`,
    notification_source: `sub_granted_${params.userId}_${Date.now()}`,
    target_type: 'user',
    priority: 'normal',
    user_id: params.userId,
  })
}

// ─── 2. Subscription Expiry Warning ──────────────────────────────────────────

export async function notifySubscriptionExpiring(params: {
  userId: string
  subjectId: string
  subjectName: string
  daysLeft: number
}) {
  const source = `sub_expiry_${params.subjectId}_${params.daysLeft}d_${params.userId}`
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('notification_source', source)
    .maybeSingle()

  if (existing) return null

  const priority =
    params.daysLeft === 1 ? 'critical' :
    params.daysLeft === 3 ? 'important' : 'normal'

  return insertNotification({
    title: `Subscription Expiring in ${params.daysLeft} Day${params.daysLeft > 1 ? 's' : ''}`,
    message: `Your access to ${params.subjectName} expires in ${params.daysLeft} day${params.daysLeft > 1 ? 's' : ''}. Contact support to renew.`,
    notification_source: source,
    target_type: 'user',
    priority,
    user_id: params.userId,
  })
}

// ─── 3. Subscription Expired ──────────────────────────────────────────────────

export async function notifySubscriptionExpired(params: {
  userId: string
  subjectId: string
  subjectName: string
}) {
  const source = `sub_expired_${params.subjectId}_${params.userId}`
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('notification_source', source)
    .maybeSingle()

  if (existing) return null

  return insertNotification({
    title: `Subscription Expired — ${params.subjectName}`,
    message: `Your subscription to ${params.subjectName} has expired. Please contact support to renew your access.`,
    notification_source: source,
    target_type: 'user',
    priority: 'critical',
    user_id: params.userId,
  })
}

// ─── 4. Admin Assigned to Subject ────────────────────────────────────────────

export async function notifyAdminAssigned(params: {
  adminUserId: string
  subjectName: string
  universityName: string
}) {
  return insertNotification({
    title: `You Have Been Assigned to ${params.subjectName}`,
    message: `You have been assigned as an admin for ${params.subjectName} at ${params.universityName}. You can now manage content for this subject.`,
    notification_source: `admin_assigned_${params.adminUserId}_${Date.now()}`,
    target_type: 'user',
    priority: 'important',
    user_id: params.adminUserId,
  })
}

// ─── 5. Admin Removed from Subject ───────────────────────────────────────────

export async function notifyAdminRemoved(params: {
  adminUserId: string
  subjectName: string
  universityName: string
}) {
  return insertNotification({
    title: `Assignment Removed — ${params.subjectName}`,
    message: `You have been removed as admin from ${params.subjectName} at ${params.universityName}.`,
    notification_source: `admin_removed_${params.adminUserId}_${Date.now()}`,
    target_type: 'user',
    priority: 'important',
    user_id: params.adminUserId,
  })
}

// ─── 6. New University Added ──────────────────────────────────────────────────

export async function notifyNewUniversity(params: {
  universityName: string
}) {
  return insertNotification({
    title: `New University Added — ${params.universityName}`,
    message: `${params.universityName} has been added to MedNavigator. Students from this university can now register and access their subjects.`,
    notification_source: `university_added_${Date.now()}`,
    target_type: 'all',
    priority: 'normal',
  })
}

// ─── 7. New Subject Added ─────────────────────────────────────────────────────

export async function notifyNewSubject(params: {
  universityId: string
  universityName: string
  subjectName: string
}) {
  return insertNotification({
    title: `New Subject Available — ${params.subjectName}`,
    message: `${params.subjectName} has been added for ${params.universityName} students on MedNavigator.`,
    notification_source: `subject_added_${Date.now()}`,
    target_type: 'university',
    priority: 'normal',
    university_id: params.universityId,
  })
}

// ─── 8. University Request — Notify Owner ─────────────────────────────────────

export async function notifyOwnerUniversityRequest(params: {
  ownerUserId: string
  requestedName: string
  studentName: string
}) {
  return insertNotification({
    title: `University Request — ${params.requestedName}`,
    message: `${params.studentName} has requested to add "${params.requestedName}" to MedNavigator. Review this request in the University Requests section.`,
    notification_source: `uni_request_${Date.now()}`,
    target_type: 'user',
    priority: 'important',
    user_id: params.ownerUserId,
  })
}