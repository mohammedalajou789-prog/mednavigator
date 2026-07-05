import { readFileSync, writeFileSync } from 'fs'

const path = "src/app/(student)/[uniSlug]/[subjectSlug]/page.tsx"
let content = readFileSync(path, 'utf8')

content = content.replace(
  `  if (!subject || !university) notFound()`,
  `  if (!subject || !university) notFound()\n  const safeUniversity = university!;\n  const safeSubject = subject!;`
)

content = content.replace(
  `    universityName: university.name,`,
  `    universityName: safeUniversity.name,`
)

content = content.replace(
  `    subjectName: subject.name,`,
  `    subjectName: safeSubject.name,`
)

content = content.replace(
  `    subjectDescription: subject.description ?? null,`,
  `    subjectDescription: safeSubject.description ?? null,`
)

content = content.replace(
  `    subjectType: subject.subject_type,`,
  `    subjectType: safeSubject.subject_type,`
)

content = content.replace(
  `    accessMode: subject.access_mode,`,
  `    accessMode: safeSubject.access_mode,`
)

content = content.replace(
  `    isSystem,`,
  `    isSystem,`
)

writeFileSync(path, content, 'utf8')
console.log('done')