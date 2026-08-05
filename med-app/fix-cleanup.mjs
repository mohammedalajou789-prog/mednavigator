import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Lines to remove (0-indexed): 105 to 120
// These are the leftover Login/</Link> and 2400+ students block
const removeFrom = 105  // "            Login"
const removeTo = 120    // "        </div>"

console.log('Lines to remove:')
for (let i = removeFrom; i <= removeTo; i++) {
  console.log(`  ${i + 1}: ${lines[i]}`)
}

const result = [
  ...lines.slice(0, removeFrom),
  ...lines.slice(removeTo + 1)
]

writeFileSync(path, result.join('\n'), 'utf8')
console.log('done - removed lines', removeFrom + 1, 'to', removeTo + 1)