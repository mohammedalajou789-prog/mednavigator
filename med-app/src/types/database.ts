export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'admin' | 'student'
export type UserStatus = 'active' | 'disabled' | 'banned'
export type SubjectType = 'standard' | 'system' | 'clinical'
export type SubjectCategory = 'preclinical' | 'clinical_major' | 'clinical_minor'
export type AccessMode = 'free' | 'premium' | 'mixed'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type LectureStatus = 'draft' | 'published' | 'archived'
export type VideoProvider = 'youtube' | 'protected'
export type SubscriptionStatus = 'active' | 'expired' | 'revoked'
export type SubscriptionAction = 'granted' | 'extended' | 'revoked' | 'expired'
export type DeviceResetStatus = 'pending' | 'approved' | 'rejected'
export type UniversityRequestStatus = 'pending' | 'approved' | 'rejected'
export type NotificationPriority = 'normal' | 'important' | 'critical'
export type NotificationTargetType = 'all' | 'university' | 'subject' | 'user'
export type BookmarkType = 'subject' | 'lecture' | 'question' | 'flashcard'
export type ContentProgressType = 'sheet' | 'summary' | 'flashcards' | 'quiz' | 'previous_years'
export type ClinicalModuleType = 'osce' | 'mini_osce' | 'oral_exam'
export type ExamType = 'final' | 'midterm' | 'quiz' | 'practical'
export type ThemePreference = 'light' | 'dark' | 'system'
export type ImageSlotEntityType =
  | 'sheet'
  | 'summary'
  | 'flashcard'
  | 'quiz_question'
  | 'previous_year_question'
  | 'clinical_sheet'
export type AnalyticsEventType =
  | 'sheet_view'
  | 'summary_view'
  | 'quiz_attempt'
  | 'flashcard_review'
  | 'previous_years_view'
  | 'clinical_sheet_view'
  | 'lecture_view'
  | 'search'
  | 'login'
export type ContentVersionEntityType = 'sheet' | 'summary' | 'clinical_sheet'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          full_name: string | null
          email: string | null
          phone: string | null
          role: UserRole
          status: UserStatus
          default_university_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: UserRole
          status?: UserStatus
          default_university_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: UserRole
          status?: UserStatus
          default_university_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      universities: {
        Row: {
          id: string
          name: string
          country: string | null
          description: string | null
          logo_url: string | null
          logo_media_id: string | null
          cover_media_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          name: string
          country?: string | null
          description?: string | null
          logo_url?: string | null
          logo_media_id?: string | null
          cover_media_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          country?: string | null
          description?: string | null
          logo_url?: string | null
          logo_media_id?: string | null
          cover_media_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }university_requests: {
        Row: {
          id: string
          user_id: string
          requested_university_name: string
          status: UniversityRequestStatus
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          requested_university_name: string
          status?: UniversityRequestStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          requested_university_name?: string
          status?: UniversityRequestStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          university_id: string
          name: string
          description: string | null
          subject_type: SubjectType
          category: SubjectCategory | null
          access_mode: AccessMode
          price: number
          is_free: boolean
          is_published: boolean
          is_active: boolean
          thumbnail_url: string | null
          cover_media_id: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          university_id: string
          name: string
          description?: string | null
          subject_type: SubjectType
          category?: SubjectCategory | null
          access_mode?: AccessMode
          price?: number
          is_free?: boolean
          is_published?: boolean
          is_active?: boolean
          thumbnail_url?: string | null
          cover_media_id?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          university_id?: string
          name?: string
          description?: string | null
          subject_type?: SubjectType
          category?: SubjectCategory | null
          access_mode?: AccessMode
          price?: number
          is_free?: boolean
          is_published?: boolean
          is_active?: boolean
          thumbnail_url?: string | null
          cover_media_id?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      chapters: {
        Row: {
          id: string
          subject_id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          subject_id: string
          title: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          subject_id?: string
          title?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      sub_subjects: {
        Row: {
          id: string
          subject_id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          subject_id: string
          title: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          subject_id?: string
          title?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      lectures: {
        Row: {
          id: string
          subject_id: string | null
          chapter_id: string | null
          sub_subject_id: string | null
          title: string
          description: string | null
          status: LectureStatus
          is_preview: boolean
          display_order: number
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          subject_id?: string | null
          chapter_id?: string | null
          sub_subject_id?: string | null
          title: string
          description?: string | null
          status?: LectureStatus
          is_preview?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          subject_id?: string | null
          chapter_id?: string | null
          sub_subject_id?: string | null
          title?: string
          description?: string | null
          status?: LectureStatus
          is_preview?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      sheets: {
        Row: {
          id: string
          lecture_id: string
          title: string
          content: string | null
          status: ContentStatus
          version: number
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          lecture_id: string
          title: string
          content?: string | null
          status?: ContentStatus
          version?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          lecture_id?: string
          title?: string
          content?: string | null
          status?: ContentStatus
          version?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      summaries: {
        Row: {
          id: string
          lecture_id: string
          title: string
          content: string | null
          status: ContentStatus
          version: number
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          lecture_id: string
          title: string
          content?: string | null
          status?: ContentStatus
          version?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          lecture_id?: string
          title?: string
          content?: string | null
          status?: ContentStatus
          version?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      flashcards: {
        Row: {
          id: string
          lecture_id: string
          front_text: string
          back_text: string
          tags: string[]
          display_order: number
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          lecture_id: string
          front_text: string
          back_text: string
          tags?: string[]
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          lecture_id?: string
          front_text?: string
          back_text?: string
          tags?: string[]
          display_order?: number
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      quiz_questions: {
        Row: {
          id: string
          lecture_id: string
          question: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          option_e: string | null
          correct_answer: string | null
          explanation: string | null
          tags: string[]
          image_slot_id: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          lecture_id: string
          question: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          option_e?: string | null
          correct_answer?: string | null
          explanation?: string | null
          tags?: string[]
          image_slot_id?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          lecture_id?: string
          question?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          option_e?: string | null
          correct_answer?: string | null
          explanation?: string | null
          tags?: string[]
          image_slot_id?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }previous_year_questions: {
        Row: {
          id: string
          lecture_id: string
          question: string
          options: Json
          correct_answer: string | null
          answer: string | null
          explanation: string | null
          exam_year: number | null
          exam_type: ExamType | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          lecture_id: string
          question: string
          options?: Json
          correct_answer?: string | null
          answer?: string | null
          explanation?: string | null
          exam_year?: number | null
          exam_type?: ExamType | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          lecture_id?: string
          question?: string
          options?: Json
          correct_answer?: string | null
          answer?: string | null
          explanation?: string | null
          exam_year?: number | null
          exam_type?: ExamType | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      subject_subscriptions: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          activated_by: string | null
          start_date: string
          end_date: string
          expiry_date: string | null
          status: SubscriptionStatus
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          activated_by?: string | null
          start_date: string
          end_date: string
          status?: SubscriptionStatus
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          activated_by?: string | null
          start_date?: string
          end_date?: string
          status?: SubscriptionStatus
          notes?: string | null
          created_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          user_id: string
          device_fingerprint: string
          device_name: string | null
          is_active: boolean
          activated_at: string
          deactivated_at: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_fingerprint: string
          device_name?: string | null
          is_active?: boolean
          activated_at?: string
          deactivated_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_fingerprint?: string
          device_name?: string | null
          is_active?: boolean
          activated_at?: string
          deactivated_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          notification_source: string
          target_type: NotificationTargetType
          priority: NotificationPriority
          university_id: string | null
          subject_id: string | null
          user_id: string | null
          created_by: string | null
          created_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          title: string
          message: string
          notification_source: string
          target_type: NotificationTargetType
          priority?: NotificationPriority
          university_id?: string | null
          subject_id?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          message?: string
          notification_source?: string
          target_type?: NotificationTargetType
          priority?: NotificationPriority
          university_id?: string | null
          subject_id?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          archived_at?: string | null
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          content_type: ContentProgressType
          progress_percentage: number
          completed: boolean
          last_position: number
          last_accessed_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
          content_type: ContentProgressType
          progress_percentage?: number
          completed?: boolean
          last_position?: number
          last_accessed_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_id?: string
          content_type?: ContentProgressType
          progress_percentage?: number
          completed?: boolean
          last_position?: number
          last_accessed_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: ThemePreference
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: ThemePreference
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: ThemePreference
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_assignments: {
        Row: {
          id: string
          user_id: string
          university_id: string
          subject_id: string
          assigned_by: string | null
          assigned_at: string
          is_active: boolean
          removed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          university_id: string
          subject_id: string
          assigned_by?: string | null
          assigned_at?: string
          is_active?: boolean
          removed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          university_id?: string
          subject_id?: string
          assigned_by?: string | null
          assigned_at?: string
          is_active?: boolean
          removed_at?: string | null
        }
      }
      platform_settings: {
        Row: {
          id: string
          platform_name: string
          logo_url: string | null
          support_email: string | null
          whatsapp_url: string | null
          terms_of_service: string | null
          privacy_policy: string | null
          owner_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform_name: string
          logo_url?: string | null
          support_email?: string | null
          whatsapp_url?: string | null
          terms_of_service?: string | null
          privacy_policy?: string | null
          owner_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform_name?: string
          logo_url?: string | null
          support_email?: string | null
          whatsapp_url?: string | null
          terms_of_service?: string | null
          privacy_policy?: string | null
          owner_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_platform_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_subject: {
        Args: { subject_id: string }
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type User = Tables<'users'>
export type University = Tables<'universities'>
export type Subject = Tables<'subjects'>
export type Chapter = Tables<'chapters'>
export type Lecture = Tables<'lectures'>
export type Sheet = Tables<'sheets'>
export type Summary = Tables<'summaries'>
export type Flashcard = Tables<'flashcards'>
export type QuizQuestion = Tables<'quiz_questions'>
export type PreviousYearQuestion = Tables<'previous_year_questions'>
export type SubjectSubscription = Tables<'subject_subscriptions'>
export type Device = Tables<'devices'>
export type Notification = Tables<'notifications'>
export type UserProgress = Tables<'user_progress'>
export type UserPreference = Tables<'user_preferences'>
export type AdminAssignment = Tables<'admin_assignments'>
export type PlatformSettings = Tables<'platform_settings'>