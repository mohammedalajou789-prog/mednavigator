'use client'

import { create } from 'zustand'
import type { Notification } from '@/types/database'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  setNotifications: (notifications: Notification[]) => void
  setUnreadCount: (count: number) => void
  setLoading: (loading: boolean) => void
  markAllAsRead: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (isLoading) => set({ isLoading }),
  markAllAsRead: () => set({ notifications: [], unreadCount: 0 }),
}))
