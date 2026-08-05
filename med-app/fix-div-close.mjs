import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

let btnsCloseLine = -1
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mn-btns') && lines[i].includes("display: 'flex'")) {
    for (let j = i + 1; j < i + 20; j++) {
      if (lines[j].trimEnd() === '        </div>') {
        btnsCloseLine = j
        break
      }
    }
    break
  }
}

console.log(`mn-btns closing div at line: ${btnsCloseLine + 1}`)

const result = [
  ...lines.slice(0, btnsCloseLine + 1),
  '      </div>',
  ...lines.slice(btnsCloseLine + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')