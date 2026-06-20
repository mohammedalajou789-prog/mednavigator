'use client'

import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/stores/uiStore'

export default function OwnerTopBar() {
  const { theme, setTheme } = useUIStore()

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 gap-2 sticky top-0 z-20">
      <button
        onClick={() => {
          if (theme === 'light') setTheme('dark')
          else if (theme === 'dark') setTheme('system')
          else setTheme('light')
        }}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={`Theme: ${theme}`}
      >
        <i
          className={cn(
            'ti text-lg',
            theme === 'dark'
              ? 'ti-moon'
              : theme === 'light'
              ? 'ti-sun'
              : 'ti-device-laptop'
          )}
          aria-hidden="true"
        />
      </button>
    </header>
  )
}