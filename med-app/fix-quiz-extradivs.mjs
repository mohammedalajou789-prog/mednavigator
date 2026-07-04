import { readFileSync, writeFileSync } from 'fs'

const path = 'src/components/student/QuizViewer.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Confirm exact lines 228-233
for (let i = 227; i <= 233; i++) {
  console.log(i+1, JSON.stringify(lines[i]))
}

// Line 230 (index 229) = "            </div>"  — extra, remove
// Line 231 (index 230) = "          </div>"    — extra, remove
lines[229] = ''
lines[230] = ''
console.log('Fixed lines 230 and 231')

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')