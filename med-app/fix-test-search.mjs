import { readFileSync, writeFileSync } from 'fs'

const path = 'C:\\Users\\mohammed alajou\\Documents\\mednavigator\\med-app\\src\\components\\student\\LectureSidebarShell.tsx'

const lines = readFileSync(path, 'utf8').split('\n')

const idx = lines.findIndex(l => l.includes('Content Search') && l.includes('/*'))
console.log('Found comment at line:', idx)

// Find the LectureContentSearch block and wrap it in a div with pointerEvents: none on the container but not the input
const searchIdx = lines.findIndex(l => l.includes('<LectureContentSearch'))
console.log('LectureContentSearch at line:', searchIdx)
console.log('Line:', lines[searchIdx])

// Add isolate style to the wrapper div (line before LectureContentSearch)
const wrapperIdx = searchIdx - 1
console.log('Wrapper line:', lines[wrapperIdx])
console.log('Wrapper content:', lines[wrapperIdx])

lines[wrapperIdx] = lines[wrapperIdx].replace(
  '!sidebarCollapsed && (activeTab === \'sheet\' || activeTab === \'summary\') && (',
  '!sidebarCollapsed && (activeTab === \'sheet\' || activeTab === \'summary\') && false && ('
)

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done - search hidden for testing')