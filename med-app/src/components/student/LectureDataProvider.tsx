
'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface LectureInfo {
  id: string
  title: string
  description: string | null
  status: string
}

export interface SubjectInfo {
  id: string
  name: string
  access_mode: string | null
  is_free: boolean | null
}

export interface LectureDataValue {
  lecture: LectureInfo
  subject: SubjectInfo
  userId: string | null
  userName: string | null
  accessAllowed: boolean
  availableTabs: string[]
}

const LectureDataContext = createContext<LectureDataValue | null>(null)

export function LectureDataProvider({
  value,
  children,
}: {
  value: LectureDataValue
  children: ReactNode
}) {
  return (
    <LectureDataContext.Provider value={value}>
      {children}
    </LectureDataContext.Provider>
  )
}

export function useLectureData() {
  const ctx = useContext(LectureDataContext)
  if (!ctx) {
    throw new Error(
      'useLectureData must be used inside a lecture sub-route page (sheet/summary/flashcards/quiz/previous-years).'
    )
  }
  return ctx
}