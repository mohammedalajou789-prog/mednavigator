export const APP_NAME = 'MedNavigator'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  OWNER_HOME: '/owner',
  ADMIN_HOME: '/admin',
} as const

export const ROLE_REDIRECTS = {
  owner: '/owner',
  admin: '/admin',
  student: '/',
} as const

export const CONTENT_STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
} as const

export const SUBJECT_TYPE_LABELS = {
  standard: 'Standard Subject',
  system: 'System Subject',
  clinical: 'Clinical Subject',
} as const

export const ACCESS_MODE_LABELS = {
  free: 'Fully Free',
  premium: 'Premium',
  mixed: 'Mixed Access',
} as const

export const EXAM_TYPE_LABELS = {
  final: 'Final',
  midterm: 'Midterm',
  quiz: 'Quiz',
  practical: 'Practical',
} as const

export const SUBSCRIPTION_WARNING_DAYS = [7, 3, 1] as const
export const DEFAULT_PAGE_SIZE = 20
export const RECENTLY_UPDATED_DAYS = 7
export const DEFAULT_DEVICE_LIMIT = 1
export const MAX_CLINICAL_MODULES = 3
