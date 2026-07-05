import { readFileSync, writeFileSync } from 'fs'

const path = "src/app/(student)/[uniSlug]/[subjectSlug]/page.tsx"
const lines = readFileSync(path, 'utf8').split('\n')

// Fix line 201 (index 201): subject.subject_type → safeSubject.subject_type
lines[201] = lines[201].replace('subject.subject_type', 'safeSubject.subject_type')

// Fix line 285 (index 285): ?? null → ?? ''
lines[285] = lines[285].replace('?? null', "?? ''")

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')
console.log('line 201:', lines[201])
console.log('line 285:', lines[285])