// ─────────────────────────────────────────────────────────────────────────────
// Lecture navigation helpers
// Used by: StudentLayout (top-bar Exit button) and LectureSidebarShell
// (Back to Subject). Goal: leaving a lecture must never leave a lecture page
// behind in the browser history, so the browser Back arrow cannot reopen it.
// ─────────────────────────────────────────────────────────────────────────────

export const LECTURE_TABS = ['sheet', 'summary', 'flashcards', 'quiz', 'previous-years']

// 3rd URL segments that belong to the SUBJECT, not to a lecture
const SUBJECT_LEVEL_SEGMENTS = ['chapter', 'flashcards-bank', 'previous-years', 'quiz-bank']

const ENTRY_KEY = 'mn:lecture-entry'

interface LectureEntry {
  lecture: string
  from: string | null
}

interface MinimalRouter {
  back: () => void
  replace: (href: string) => void
}

function segmentsOf(pathname: string): string[] {
  return pathname.split('?')[0].split('/').filter(Boolean)
}

/** '/uni/subject/lecture' when the pathname is inside a lecture, otherwise null. */
export function getLectureBase(pathname: string): string | null {
  const s = segmentsOf(pathname)
  if (s.length < 3 || s.length > 4) return null
  if (SUBJECT_LEVEL_SEGMENTS.includes(s[2])) return null
  if (s.length === 4 && !LECTURE_TABS.includes(s[3])) return null
  return `/${s[0]}/${s[1]}/${s[2]}`
}

export function isLecturePath(pathname: string): boolean {
  return getLectureBase(pathname) !== null
}

/** Called on every route change. Remembers where the student came from when entering a lecture. */
export function recordLectureEntry(prevPath: string | null, currentPath: string): void {
  const lecture = getLectureBase(currentPath)
  if (!lecture) return
  // Tab switch or redirect inside the same lecture → keep the original entry
  if (prevPath && getLectureBase(prevPath) === lecture) return
  try {
    const entry: LectureEntry = { lecture, from: prevPath }
    sessionStorage.setItem(ENTRY_KEY, JSON.stringify(entry))
  } catch {
    // sessionStorage unavailable (private mode) → exitLecture falls back to replace
  }
}

/**
 * Leave the lecture and land on the subject page.
 * - Came from the subject page → go back in history (removes the lecture entry).
 * - Came from anywhere else     → replace the lecture entry with the subject page.
 * Either way the lecture is no longer reachable with the browser Back arrow.
 */
export function exitLecture(router: MinimalRouter, pathname: string): void {
  const lecture = getLectureBase(pathname)
  if (!lecture) return
  const s = segmentsOf(pathname)
  const subjectUrl = `/${s[0]}/${s[1]}`

  let entry: LectureEntry | null = null
  try {
    entry = JSON.parse(sessionStorage.getItem(ENTRY_KEY) ?? 'null') as LectureEntry | null
    sessionStorage.removeItem(ENTRY_KEY)
  } catch {
    entry = null
  }

  if (entry && entry.lecture === lecture && entry.from === subjectUrl) {
    router.back()
  } else {
    router.replace(subjectUrl)
  }
}
