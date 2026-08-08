import { readFileSync, writeFileSync } from 'fs'

const path = "C:\\Users\\mohammed alajou\\Documents\\mednavigator\\med-app\\src\\components\\student\\MNRenderer.tsx"

let content = readFileSync(path, 'utf8')
const lines = content.split('\n')

// نطبع السطور 568-580 للتأكد
for (let i = 568; i < 580; i++) {
  console.log(i + 1, JSON.stringify(lines[i]))
}

// نحذف السطر الذي يحتوي على '          )}' الزائد
// وهو السطر بعد '</div>' '</div>'
let targetIdx = -1
for (let i = 570; i < 578; i++) {
  if (
    lines[i]?.trim() === ')}' &&
    lines[i-1]?.trim() === '</div>' &&
    lines[i-2]?.trim() === '</div>'
  ) {
    targetIdx = i
    break
  }
}

if (targetIdx === -1) {
  console.log('ERROR: not found')
  process.exit(1)
}

console.log('removing line:', targetIdx + 1, JSON.stringify(lines[targetIdx]))
lines.splice(targetIdx, 1)

const result = lines.join('\n')
writeFileSync(path, result, 'utf8')
console.log('done')