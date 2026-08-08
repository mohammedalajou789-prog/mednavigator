import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/LectureHub.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// ── Step 1: Add 3 refs after the existing index state declarations ──────────
// Index 292 = const [currentFlashcardIndex...]
// Index 293 = const [currentQuizIndex...]
// Index 294 = const [currentPyqIndex...]
// We insert 3 new ref lines after index 294 (after pyqIndex state)
console.log('Before 292:', lines[292])
console.log('Before 293:', lines[293])
console.log('Before 294:', lines[294])

// Insert 3 ref lines after line index 294
lines.splice(295, 0,
  '',
  '  // \u2500\u2500 Refs to always hold latest index values for closures \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
  '  const flashcardIndexLive = useRef<number>(0)',
  '  const quizIndexLive      = useRef<number>(0)',
  '  const pyqIndexLive       = useRef<number>(0)',
)
console.log('Inserted 3 live index refs after line 295')

// ── Step 2: Update the 3 handlers to also write to the refs ────────────────
// After splice, line indexes have shifted by 5
// Original 663 → now 668: handleFlashcardIndexChange
// Original 664 → now 669: setCurrentFlashcardIndex(index)
// Original 665 → now 670: saveResumeState call for flashcard
// Original 667 → now 672: handleQuizIndexChange
// Original 668 → now 673: setCurrentQuizIndex(index)
// Original 669 → now 674: saveResumeState call for quiz
// Original 671 → now 676: handlePyqIndexChange
// Original 672 → now 677: setCurrentPyqIndex(index)
// Original 673 → now 678: saveResumeState call for pyq

// Verify by printing the lines around handlers
console.log('\nLines after splice (handlers area):')
for (let i = 667; i <= 685; i++) {
  console.log(`[${i}]: ${lines[i]}`)
}

// Fix handleFlashcardIndexChange — add ref update
lines[669] = '    flashcardIndexLive.current = index'
lines[670] = '    setCurrentFlashcardIndex(index)'
lines[671] = '    saveResumeState(activeTab, sheetScrollRef.current, summaryScrollRef.current, index, quizIndexLive.current, pyqIndexLive.current)'

// Fix handleQuizIndexChange — add ref update  
lines[674] = '    quizIndexLive.current = index'
lines[675] = '    setCurrentQuizIndex(index)'
lines[676] = '    saveResumeState(activeTab, sheetScrollRef.current, summaryScrollRef.current, flashcardIndexLive.current, index, pyqIndexLive.current)'

// Fix handlePyqIndexChange — add ref update
lines[679] = '    pyqIndexLive.current = index'
lines[680] = '    setCurrentPyqIndex(index)'
lines[681] = '    saveResumeState(activeTab, sheetScrollRef.current, summaryScrollRef.current, flashcardIndexLive.current, quizIndexLive.current, index)'

// Fix handleTabChange — use live refs
lines[685] = '    saveResumeState(tab, sheetScrollRef.current, summaryScrollRef.current, flashcardIndexLive.current, quizIndexLive.current, pyqIndexLive.current)'

console.log('\nLines after fix (handlers area):')
for (let i = 667; i <= 690; i++) {
  console.log(`[${i}]: ${lines[i]}`)
}

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('\nDone — resume index fixes applied')