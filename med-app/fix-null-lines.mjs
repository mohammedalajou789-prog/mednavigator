import { readFileSync, writeFileSync } from 'fs'

const path = "src/app/(student)/[uniSlug]/[subjectSlug]/page.tsx"
const lines = readFileSync(path, 'utf8').split('\n')

// Fix index 202: subject.subject_type → safeSubject.subject_type
lines[202] = lines[202].replace('subject.subject_type', 'safeSubject.subject_type')

// Fix index 282: ?? null → ?? ''
lines[282] = lines[282].replace('?? null', "?? ''")

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')
console.log('line 202:', lines[202])
console.log('line 282:', lines[282])