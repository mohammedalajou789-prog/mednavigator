import { readFileSync, writeFileSync } from 'fs'

const path = "C:\\Users\\mohammed alajou\\Documents\\mednavigator\\med-app\\src\\components\\student\\MNRenderer.tsx"

let content = readFileSync(path, 'utf8')
const lines = content.split('\n')

// السطر 576 (index 575) — </div> الزائد
console.log('line 575:', JSON.stringify(lines[575]))
console.log('line 576:', JSON.stringify(lines[576]))
console.log('line 574:', JSON.stringify(lines[574]))

// نحذف السطر 576 (index 575)
lines.splice(575, 1)

const result = lines.join('\n')
writeFileSync(path, result, 'utf8')
console.log('done')