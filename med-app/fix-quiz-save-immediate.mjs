import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/(student)/[uniSlug]/[subjectSlug]/[lectureSlug]/quiz/page.tsx'
let content = readFileSync(path, 'utf8')

// Replace saveIndex with immediate save + console.log
content = content.replace(
  `  // ── Save index (debounced) ────────────────────────────────────────────────
  const saveIndex = useCallback((index: number) => {
    if (!meta?.userId || !meta?.lecture?.id) return
    if (indexSaveTimer.current) clearTimeout(indexSaveTimer.current)
    indexSaveTimer.current = setTimeout(() => {
      supabase.from('user_progress').upsert({
        user_id:             meta.userId!,
        lecture_id:          meta.lecture!.id,
        content_type:        'quiz',
        progress_percentage: 0,
        completed:           false,
        last_position:       index,
        last_accessed_at:    new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id,lecture_id,content_type' })
    }, 1500)
  }, [meta?.userId, meta?.lecture?.id, supabase])`,
  `  // ── Save index (immediate) ────────────────────────────────────────────────
  const saveIndex = useCallback(async (index: number) => {
    console.log('[Quiz] saveIndex:', index, 'userId:', meta?.userId, 'lectureId:', meta?.lecture?.id)
    if (!meta?.userId || !meta?.lecture?.id) return
    const { error } = await supabase.from('user_progress').upsert({
      user_id:             meta.userId!,
      lecture_id:          meta.lecture!.id,
      content_type:        'quiz',
      progress_percentage: 0,
      completed:           false,
      last_position:       index,
      last_accessed_at:    new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id,content_type' })
    if (error) console.error('[Quiz] saveIndex error:', error)
    else console.log('[Quiz] saveIndex success for index:', index)
  }, [meta?.userId, meta?.lecture?.id, supabase])`
)

if (!content.includes('[Quiz] saveIndex:')) {
  console.log('ERROR: replacement not found — CRLF issue')
  process.exit(1)
}

writeFileSync(path, content, 'utf8')
console.log('done')
console.log('saveIndex is now immediate with console.log')