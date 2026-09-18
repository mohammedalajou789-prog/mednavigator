import { readFileSync, writeFileSync } from 'fs'

const pages = [
  'src/app/(student)/[uniSlug]/[subjectSlug]/[lectureSlug]/sheet/page.tsx',
  'src/app/(student)/[uniSlug]/[subjectSlug]/[lectureSlug]/summary/page.tsx',
  'src/app/(student)/[uniSlug]/[subjectSlug]/[lectureSlug]/flashcards/page.tsx',
  'src/app/(student)/[uniSlug]/[subjectSlug]/[lectureSlug]/quiz/page.tsx',
  'src/app/(student)/[uniSlug]/[subjectSlug]/[lectureSlug]/previous-years/page.tsx',
]

for (const f of pages) {
  let c = readFileSync(f, 'utf8')
  if (!c.includes("import Link from 'next/link'")) {
    c = c.replace(
      "import { useParams } from 'next/navigation'",
      "import { useParams } from 'next/navigation'\r\nimport Link from 'next/link'"
    )
  }
  c = c.replace(/<a href=\{/g, '<Link href={')
  c = c.replace(/<\/a>/g, '</Link>')
  writeFileSync(f, c, 'utf8')
  console.log('fixed:', f)
}

const memoFixes = [
  { file: 'src/components/student/FlashcardsViewer.tsx',      old: "import { useState, useEffect } from 'react'",            new: "import { useState, useEffect, useMemo } from 'react'" },
  { file: 'src/components/student/QuizViewer.tsx',             old: "import { useState, useEffect } from 'react'",            new: "import { useState, useEffect, useMemo } from 'react'" },
  { file: 'src/components/student/PreviousYearsViewer.tsx',    old: "import { useState, useEffect, useRef } from 'react'",    new: "import { useState, useEffect, useRef, useMemo } from 'react'" },
  { file: 'src/components/student/LectureAccessTracker.tsx',   old: "import { useEffect } from 'react'",                      new: "import { useEffect, useMemo } from 'react'" },
]

for (const fix of memoFixes) {
  let c = readFileSync(fix.file, 'utf8')
  c = c.replace(fix.old, fix.new)
  c = c.replace('  const supabase = createClient()', '  const supabase = useMemo(() => createClient(), [])')
  writeFileSync(fix.file, c, 'utf8')
  console.log('fixed:', fix.file)
}

console.log('done')