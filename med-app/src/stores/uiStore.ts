'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types/app'

interface UIStore {
  theme: Theme
  sidebarOpen: boolean
  isMobile: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsMobile: (isMobile: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      isMobile: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setIsMobile: (isMobile) => set({ isMobile, sidebarOpen: isMobile ? false : true }),
    }),
    {
      name: 'mednavigator-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
