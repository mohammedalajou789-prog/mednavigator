'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  isMobile: boolean
  theme: 'light' | 'dark' | 'system'
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setIsMobile: (isMobile: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      isMobile: false,
      theme: 'system',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setIsMobile: (isMobile) => set({ isMobile, sidebarOpen: isMobile ? false : true }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'mednavigator-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
