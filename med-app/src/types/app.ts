export type UserRole = 'owner' | 'admin' | 'student'

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

export interface Subject {
  id: string
  university_id: string
  name: string
  description: string | null
  subject_type: string
  category: string | null
  access_mode: string | null
  price: number | null
  is_free: boolean | null
  is_published: boolean | null
  is_active: boolean | null
  thumbnail_url: string | null
  cover_media_id: string | null
  created_at: string | null
  updated_at: string | null
  archived_at: string | null
}

export interface University {
  id: string
  name: string
  country: string | null
  description: string | null
  logo_url: string | null
  logo_media_id: string | null
  cover_media_id: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  archived_at: string | null
}

export interface SubjectSubscription {
  id: string
  user_id: string
  subject_id: string
  start_date: string
  end_date: string
  expiry_date: string | null
  status: string
  notes: string | null
  created_at: string | null
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