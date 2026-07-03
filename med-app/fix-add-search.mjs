import { readFileSync, writeFileSync } from 'fs'

let c = readFileSync('src/components/student/LectureHub.tsx', 'utf8')

// Add import
c = c.replace(
  `import LockedContentCard from '@/components/student/LockedContentCard'`,
  `import LockedContentCard from '@/components/student/LockedContentCard'
import LectureContentSearch from '@/components/student/LectureContentSearch'`
)

// Add search card before the TOC card
c = c.replace(
  `        {/* ── TABLE OF CONTENTS CARD ── */}`,
  `        {/* ── LECTURE CONTENT SEARCH ── */}
        {!sidebarCollapsed && (activeTab === 'sheet' || activeTab === 'summary') && (
          <LectureContentSearch
            sheetContent={sheet?.content ?? ''}
            summaryContent={summary?.content ?? ''}
            activeTab={activeTab}
          />
        )}

        {/* ── TABLE OF CONTENTS CARD ── */}`
)

writeFileSync('src/components/student/LectureHub.tsx', c)

const result = readFileSync('src/components/student/LectureHub.tsx', 'utf8')
console.log('Import added:', result.includes('import LectureContentSearch'))
console.log('Component added:', result.includes('<LectureContentSearch'))