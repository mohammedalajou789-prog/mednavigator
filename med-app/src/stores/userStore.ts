'use client'

import { create } from 'zustand'
import type { UserProfile } from '@/types/app'
import type { UserRole } from '@/types/database'

interface UserStore {
  user: UserProfile | null
  isLoading: boolean
  defaultUniversityId: string | null
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setDefaultUniversity: (universityId: string | null) => void
  clearUser: () => void
  isOwner: () => boolean
  isAdmin: () => boolean
  isStudent: () => boolean
  getRole: () => UserRole | null
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: true,
  defaultUniversityId: null,
  setUser: (user) => set({ user, defaultUniversityId: user?.default_university_id ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  setDefaultUniversity: (universityId) => set({ defaultUniversityId: universityId }),
  clearUser: () => set({ user: null, isLoading: false, defaultUniversityId: null }),
  isOwner: () => get().user?.role === 'owner',
  isAdmin: () => get().user?.role === 'admin',
  isStudent: () => get().user?.role === 'student',
  getRole: () => get().user?.role ?? null,
}))
