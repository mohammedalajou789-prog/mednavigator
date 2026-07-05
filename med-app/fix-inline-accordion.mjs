import { readFileSync, writeFileSync } from 'fs'

const pagePath = "src/app/(student)/[uniSlug]/[subjectSlug]/page.tsx"
const lines = readFileSync(pagePath, 'utf8').split('\n')

// Line index 225 = <ChapterAccordion
// Line index 226 =   groups={groupsData}
// Line index 227 =   uniSlug={uniSlug}
// Line index 228 =   subjectSlug={subjectSlug}
// Line index 229 =   isSystem={isSystem}
// Line index 230 = />

// Replace lines 225–230 with inline accordion
const newLines = [
  `            <InlineAccordion groups={groupsData} uniSlug={uniSlug} subjectSlug={subjectSlug} />`
]

lines.splice(225, 6, ...newLines)

writeFileSync(pagePath, lines.join('\n'), 'utf8')
console.log('done')
console.log('line 225 is now:', lines[225])