import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Find the closing </div> of mn-btns
let btnsClose = -1
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mn-btns') && lines[i].includes("display: 'flex'")) {
    // Look for its closing div
    for (let j = i + 1; j < i + 20; j++) {
      if (lines[j].trimEnd() === '        </div>') {
        btnsClose = j
        break
      }
    }
    break
  }
}

console.log(`mn-btns closing div at line: ${btnsClose + 1}`)
console.log(`Line content: "${lines[btnsClose]}"`)

// Insert missing </div> after btnsClose
const result = [
  ...lines.slice(0, btnsClose + 1),
  '      </div>',
  ...lines.slice(btnsClose + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')