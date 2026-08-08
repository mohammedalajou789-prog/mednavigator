import { readFileSync, writeFileSync } from 'fs'

const path = "C:\\Users\\mohammed alajou\\Documents\\mednavigator\\med-app\\src\\components\\student\\MNRenderer.tsx"

let content = readFileSync(path, 'utf8')
const lines = content.split('\n')

// السطر 573 (index 572) — </div> زائد بعد </div> و )}
// نتحقق من السطور 570-575
for (let i = 568; i < 578; i++) {
  console.log(i + 1, JSON.stringify(lines[i]))
}

// نجد السطر الذي يحتوي على </div> الزائد
// بعد '            </div>' و '          )}' يأتي '            </div>' زائد
let targetIdx = -1
for (let i = 568; i < 578; i++) {
  if (lines[i]?.trim() === '</div>' && lines[i-1]?.trim() === ')}' && lines[i-2]?.trim() === '</div>') {
    targetIdx = i
    break
  }
}

if (targetIdx === -1) {
  console.log('ERROR: orphan div not found — checking manually')
  process.exit(1)
}

console.log('removing orphan </div> at line:', targetIdx + 1)
lines.splice(targetIdx, 1)

const result = lines.join('\n')
writeFileSync(path, result, 'utf8')
console.log('done')