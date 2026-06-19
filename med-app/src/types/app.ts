import type { UserRole, Subject, University, SubjectSubscription } from './database'

export interface UserProfile {
  id: string
  auth_user_id: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  role: UserRole
  status: 'active' | 'disabled' | 'banned'
  default_university_id: string | null
}

export interface AuthSession {
  user: UserProfile | null
  isLoading: boolean
}

export type DashboardRoute = '/owner' | '/admin' | '/'

export function getDashboardRoute(role: UserRole): DashboardRoute {
  if (role === 'owner') return '/owner'
  if (role === 'admin') return '/admin'
  return '/'
}

export interface SubjectWithAccess extends Subject {
  hasAccess: boolean
  subscription: SubjectSubscription | null
  daysRemaining: number | null
}

export type ContentAccessLevel = 'open' | 'locked'

export interface ContentAccessResult {
  level: ContentAccessLevel
  reason?: 'not_subscribed' | 'subscription_expired'
}

export interface SidebarState {
  isOpen: boolean
  isMobile: boolean
}

export type Theme = 'light' | 'dark' | 'system'

export interface NotificationSummary {
  unreadCount: number
  hasUnread: boolean
}

export interface SubjectStats {
  lectureCount: number
  chapterCount: number
  flashcardCount: number
  quizCount: number
  previousYearsCount: number
  hasClinicalModules: boolean
}

export interface UniversityWithSubjects extends University {
  subjects: Subject[]
}

export interface ServiceResult<T> {
  data: T | null
  error: string | null
}