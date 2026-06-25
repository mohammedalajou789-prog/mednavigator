'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 10,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: 1,
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}